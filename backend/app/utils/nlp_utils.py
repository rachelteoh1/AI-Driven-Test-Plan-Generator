import re
import spacy
import logging
import google.generativeai as genai
from enum import Enum
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict
import os
import json
from dotenv import load_dotenv
from datetime import datetime, timedelta
load_dotenv()
logger = logging.getLogger(__name__)
nlp = spacy.load("en_core_web_lg")

genai.configure(api_key=os.getenv("GEMINI_API_KEY_INTENT"))
model = genai.GenerativeModel('models/gemini-2.5-flash') 

# ============================================================================
# COMPREHENSIVE SCPI REGEX - Handles ALL command formats
# ============================================================================

# Common SCPI command keywords (for better detection without leading :)
SCPI_KEYWORDS = {
    'MEAS', 'CONF', 'READ', 'INIT', 'FETC', 'CALC', 'TRIG', 'SAMP', 'FORM',
    'SOUR', 'SENS', 'OUTP', 'DISP', 'SYST', 'STAT', 'ROUT', 'SCAN', 'CLOS',
    'OPEN', 'VOLT', 'CURR', 'RES', 'FREQ', 'PER', 'TEMP', 'CONT', 'FRES',
    'DATA', 'APER', 'NPLC', 'RANG', 'AUTO', 'AVER', 'COUN', 'TCON', 'DEL'
}
ENGLISH_FALSE_POSITIVES = {
    'CHANNEL', 'OUTPUT', 'INPUT', 'VOLTAGE', 'CURRENT', 'MEASURE', 'CONFIGURE',
    'ENABLE', 'DISABLE', 'USING', 'BEFORE', 'AFTER', 'THEN'
}

SCPI_REGEX = re.compile(
    r"""
    (?<!\w)                                      # Word boundary (not preceded by letter/digit)
    (?:
        # Format 1: Common commands with *
        \*[A-Z]{3,}[A-Z]*\??
        |
        # Format 2 & 3: Regular SCPI commands (with or without leading :)
        :?                                        # Optional leading colon
        [A-Z]{3,}[A-Z]*                          # First keyword (3+ letters)
        (?::[A-Z]{2,}[A-Z]*)*                    # Additional subsystems (2+ letters: :DC, :AC, :VOLT, etc.)
        \??                                       # Optional query (?)
    )
    # Optional arguments section - GREEDY capture of all arguments
    (?:
        \s+(?:ON|OFF|DEF|MIN|MAX|AUTO|ONCE|IMM|BUS|UP|DOWN|SING)(?:\b|(?=\s))  # Common keywords with boundary
        |\s*@\([^)]*\)                            # Channel list: @(101:110)
        |\s*\([^)]*\)                             # Parentheses: (1,2,3)
        |\s+[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?(?:[kKmMuUnNpP](?:[VvAaΩ]|OHM|HZ)?)?  # Numbers with units
        |\s*,\s*[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?  # Comma-separated numeric args
    )*
    (?=\s*[,;]|\s+(?:and|then|on|for|to|at|with|using|before|after)\s|\s*$)  # Stop at separators
    """,
    re.VERBOSE | re.IGNORECASE,
)

def is_likely_scpi(match_text: str, context: str = "") -> bool:
    """
    Validate if a matched text is actually a SCPI command.
    """
    upper = match_text.upper().strip()
    
    # Rule 0: Reject known English false positives (even if they match the pattern)
    first_word = re.split(r'[:\s]', upper)[0]
    if first_word in ENGLISH_FALSE_POSITIVES:
        # Only accept if it has SCPI structure (starts with : or has multiple segments)
        if not (upper.startswith(':') or upper.count(':') >= 1):
            return False
    
    # Rule 1: Starts with * - definitely SCPI
    if upper.startswith('*'):
        return True
    
    # Rule 2: Starts with : - definitely SCPI
    if upper.startswith(':'):
        return True
    
    # Rule 3: Has SCPI structure (multiple segments with :)
    if ':' in upper and len(re.findall(r'[A-Z]{3,}', upper)) >= 2:
        return True
    
    # Rule 4: Contains known SCPI keywords as first word
    if first_word in SCPI_KEYWORDS:
        return True
    
    # Rule 5: Ends with ? (query)
    if upper.endswith('?'):
        if not any(word in upper.lower() for word in ['what', 'how', 'why', 'when', 'where', 'who']):
            return True
    
    # Rule 6: Has SCPI-style arguments
    if re.search(r'\s+(?:ON|OFF|DEF|MIN|MAX|AUTO)\b', upper):
        return True
    
    # Rule 7: Has numeric arguments
    if re.search(r'\s+[-+]?\d+(?:\.\d+)?', upper):
        return True
    
    # Rule 8: Reject if it's clearly English
    english_indicators = ['THE', 'AND', 'FOR', 'WITH', 'FROM', 'ABOUT', 'THAT', 'THIS', 'WHEN', 'WHERE']
    words = upper.split()
    if len(words) > 1 and any(word in english_indicators for word in words):
        return False
    
    return False


def extract_scpi_commands_from_text(text: str) -> list:
    """
    Extract SCPI commands with improved validation.
    """
    commands = []
    seen = set()
    
    for match in SCPI_REGEX.finditer(text):
        matched_text = match.group(0).strip()
        
        # Debug output
        # print(f"  [DEBUG] Matched: '{matched_text}'")
        
        # Validate if it's actually SCPI
        if is_likely_scpi(matched_text, text):
            # Normalize the command
            cmd = matched_text.upper().rstrip(',;')
            
            # Add leading : if not present and not a * command
            # if not cmd.startswith((':', '*')):
            #     cmd = ':' + cmd
            
            if cmd not in seen:
                commands.append(cmd)
                seen.add(cmd)
                logger.debug(f"Extracted SCPI: {cmd}")
                # print(f"  [DEBUG] Accepted: '{cmd}'")
        # else:
            # print("  [DEBUG] Rejected by validation")
    
    return commands


# ============================================================================
# INTENT CLASSIFICATION
# ============================================================================
class Intent(Enum):
    """User intent categories"""
    GENERATE_TEST = "generate_test"
    EXPLAIN_COMMAND = "explain_command"
    MODIFY_SEQUENCE = "modify_sequence"
    TROUBLESHOOT = "troubleshoot"
    QUERY_CAPABILITY = "query_capability"
    UNCLEAR = "unclear"              # Ambiguous instrument-related query
    OFF_TOPIC = "off_topic"  

@dataclass
class ParsedInput:
    """Structured representation of preprocessed input"""
    original_text: str
    lemmatized_text: str
    intent: Intent
    confidence: float
    scpi_commands: List[str]
    conditions: List[str]
    targets: List[str]
    action_verbs: List[str]
    measurement_types: List[str]
    equipment_refs: List[str]
    temporal_info: List[str]
    intent_reasoning: str = ""
    missing_info: Optional[List[str]] = None
    
    def to_dict(self) -> Dict:
        return {
            "original_text": self.original_text,
            "lemmatized_text": self.lemmatized_text,
            "intent": self.intent.value,
            "confidence": self.confidence,
            "intent_reasoning": self.intent_reasoning,
            "scpi_commands": self.scpi_commands,
            "conditions": self.conditions,
            "targets": self.targets,
            "action_verbs": self.action_verbs,
            "measurement_types": self.measurement_types,
            "equipment_refs": self.equipment_refs,
            "temporal_info": self.temporal_info,
            "missing_info": self.missing_info
        }
# ============================================================================
# Enhanced Intent Detection
# ============================================================================

INTENT_PATTERNS = {
    Intent.GENERATE_TEST: [
        r"\b(generate|create|write|build|make|produce|develop)\b.*\b(test|sequence|script|program)\b",
        r"\b(automate|automation)\b",
        r"\b(measure|test|configure|setup|set\s+up)\b",
        r"\b(enable|disable|turn\s+on|turn\s+off|activate|deactivate)\b",
        r"\b(set|configure|adjust|change)\b.*\b(to|at)\b.*\d+",
        r"\b(output|voltage|current|power)\b.*\b(to|at)\b",
        r"\bfor\s+\w+\s+test\b",
    ],
    Intent.EXPLAIN_COMMAND: [
        r"\b(explain|describe|what\s+(?:does|is|are)|meaning|clarify|interpret)\b",
        r"\bhow\s+(?:does|do)\b.*\bwork\b",
        r"\bwhat\s+(?:does|is)\b.*\b(?:command|do|mean)\b",
        r"\bsyntax\s+(?:of|for)\b",
    ],
    Intent.MODIFY_SEQUENCE: [
        r"\b(modify|change|update|edit|alter|adjust|revise)\b.*\b(sequence|script|test)\b",
        r"\b(add|remove|delete|insert)\b.*\b(command|step|line)\b",
        r"\breplace\b.*\bwith\b",
    ],
    Intent.TROUBLESHOOT: [
        r"\b(error|fail|not\s+work|issue|problem|wrong|debug|fix)\b",
        r"\b(troubleshoot|diagnose)\b",
        r"\bwhy\s+(?:is|does|did)\b.*\bnot\b",
    ],
    Intent.QUERY_CAPABILITY: [
        r"\b(can|could|able|possible)\b.*\b(do|measure|test|configure)\b",
        r"\b(support|compatible|capability|feature)\b",
    ]
}

INTENT_DETECTION_PROMPT = """You are an expert at classifying user intents for a test automation system that uses SCPI commands.

Analyze the following user request and classify it into ONE of these intents:

1. **generate_test**: User wants to create/generate a new test sequence, configure equipment,
or automate measurements.

Examples:
- "measure voltage on channel 101"
- "set output to 12 V on channel 6"
- "configure channel 1 for current measurement"
- "measure voltage"
- "turn output on"

CRITICAL RULE:
Classify as "generate_test" ONLY when the request includes enough information
to generate a valid SCPI sequence WITHOUT guessing any critical parameter.

Important clarifications:
- A channel is required ONLY if the user explicitly mentions or implies one
  (e.g., channel, scan, route, mux, multi-output).
- A numeric value is required ONLY for set/configure actions that change a quantity.
- Ranges/modes (e.g., AC/DC, autorange) are NOT required unless explicitly implied
  or necessary to avoid ambiguity.

If generating SCPI would require guessing a value, measurement type, or target,
classify as "unclear".

2. **explain_command**: User wants to understand what a command does or how something works
   - Examples: "what does :OUTP do?", "explain MEAS:VOLT?", "how does this command work?"

3. **modify_sequence**: User wants to change/update an existing test sequence
   - Examples: "change the voltage to 15V", "add a delay", "remove step 3", "replace with..."

4. **troubleshoot**: User is reporting errors or problems
   - Examples: "error on line 5", "command not working", "why is this failing?", "debug this"

5. **query_capability**: User is asking if something is possible or supported
   - Examples: "can I measure current?", "does it support frequency?", "is it possible to...?"

6. **unclear**: Request is about instruments/testing but lacks critical details
   Classify as "unclear" when the request is related to instruments or testing
but lacks a complete, actionable structure.

This includes cases where:
- No clear action is specified
- An action is implied but has no target
- Parameters appear in isolation without an action

Examples:
- "do something"
- "test it"
- "configure"
- "help"
- "12 V" (value with no action)
- "channel 6" (target with no action)
- "voltage" (measurement type with no action)
- "measure this" 

IMPORTANT:
- The presence of a value, channel, or measurement type alone is NOT sufficient.
- A request qualifies as "generate_test" ONLY when ALL are present:
  1) A clear action (set / measure / enable / configure / acquire)
  2) A clear target or measurement type
  3) Enough parameters to avoid guessing

RULE OF PREFERENCE:
- Prefer "generate_test" only when a complete SCPI intent can be formed.
- Prefer "unclear" whenever generating SCPI would require assumptions.

7. **off_topic**: Request is NOT about test automation, instruments, or SCPI
   - Examples: "hello", "how are you?", "tell me a joke", "what's the weather?", "I'm feeling sad"

User Request: "{user_text}"

SCPI Commands Found: {scpi_commands}

**Classification Rules:**
- If user wants to SET/CONFIGURE/OUTPUT something but provides no numeric value (e.g., "12V", "100mA"), classify as "unclear"
- If user wants to MEASURE but provides no channel/target, classify as "unclear"
- Only classify as "generate_test" if ALL required parameters are present

Respond ONLY with valid JSON in this exact format:
{{
  "intent": "generate_test",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why you chose this intent",
  "missing_info": ["voltage value (e.g., 12V)", "channel number"]
}}

Note: Only include "missing_info" array if intent is "unclear". Otherwise omit it or set to null.

JSON Response:"""

# ============================================================================
# CONVERSATION CONTEXT MANAGEMENT
# ============================================================================

@dataclass
class ConversationContext:
    """Tracks conversation state for clarifications"""
    original_query: str = ""
    clarification_count: int = 0
    awaiting_clarification: bool = False
    partial_parsed_data: Optional[Dict] = None
    last_interaction: Optional[datetime] = None
    
    def reset(self):
        """Reset context after successful processing"""
        self.original_query = ""
        self.clarification_count = 0
        self.awaiting_clarification = False
        self.partial_parsed_data = None
        self.last_interaction = None
    
    def is_expired(self, timeout_minutes: int = 10) -> bool:
        """Check if context is too old"""
        if not self.last_interaction:
            return False
        return datetime.now() - self.last_interaction > timedelta(minutes=timeout_minutes)
    
    def update_timestamp(self):
        """Update last interaction time"""
        self.last_interaction = datetime.now()
    
    def to_dict(self) -> dict:
        data = asdict(self)
        if self.last_interaction:
            data['last_interaction'] = self.last_interaction.isoformat()
        return data

class ContextManager:
    """Manages conversation context per user/session"""
    
    def __init__(self):
        self.contexts: Dict[str, ConversationContext] = {}
    
    def get_context(self, session_id: str) -> ConversationContext:
        """Get or create context for a session"""
        if session_id not in self.contexts:
            self.contexts[session_id] = ConversationContext()
        
        ctx = self.contexts[session_id]
        
        # Reset if expired
        if ctx.is_expired():
            logger.info(f"Context expired for session {session_id}, resetting")
            ctx.reset()
        
        return ctx
    
    def combine_queries(self, original: str, clarification: str) -> str:
        """
        Intelligently combine original query with clarification.
        """
        # If clarification is a complete sentence, prefer it
        if any(word in clarification.lower() for word in ['measure', 'set', 'configure', 'test']):
            # Clarification contains action verbs - might be a complete rephrase
            return f"{original} {clarification}"
        
        # Otherwise, append clarification details
        combined = original.strip()
        
        # Add proper spacing
        if not combined.endswith(('.', ',', ';')):
            combined += ','
        
        combined += f" {clarification.strip()}"
        
        return combined

# Global context manager
context_manager = ContextManager()

# ============================================================================
# NEW QUERY DETECTION
# ============================================================================

def is_new_query(text: str, original_query: str) -> bool:
    """
    Detect if user is starting a new query instead of answering clarification.
    
    Returns True if:
    - Contains complete action verbs (measure, set, configure, explain, etc.)
    - Has SCPI commands
    - Contains question words (what, how, why) - likely a new question
    - Starts with common sentence starters (I want, can you, please)
    """
    text_lower = text.lower().strip()
    
    # Strong indicators of a NEW query
    new_query_indicators = [
        # Action verbs that start complete commands
        r'^\s*(measure|set|configure|enable|disable|test|create|generate|explain|what|how|why|can|could|please|i\s+want|i\s+need)',
        
        # Question patterns
        r'\b(what|how|why|when|where|which|who)\b.*\?',
        
        # Polite command starters
        r'^\s*(please|could\s+you|can\s+you|would\s+you)',
        
        # Complete SCPI commands
        r'^\s*:?[A-Z]{3,}[A-Z]*(?::[A-Z]{2,})+',
    ]
    
    for pattern in new_query_indicators:
        if re.search(pattern, text_lower):
            return True
    
    # Check if text contains SCPI commands
    scpi_cmds = extract_scpi_commands_from_text(text)
    if scpi_cmds:
        return True
    
    # Check similarity to original query
    # If user repeats similar words, they might be rephrasing (NEW query)
    original_words = set(original_query.lower().split())
    text_words = set(text_lower.split())
    
    # If more than 50% word overlap with original, might be a rephrase
    if len(original_words) > 0:
        overlap = len(original_words & text_words) / len(original_words)
        if overlap > 0.5:
            return True
    
    # If text is very short (just numbers/units), it's likely a clarification answer
    # e.g., "101", "12V", "channel 5"
    if len(text_lower.split()) <= 3 and not any(ind in text_lower for ind in ['measure', 'set', 'what', 'how']):
        return False
    
    return False

def clean_scpi_for_intent(scpi_commands: List[str], intent: Intent) -> List[str]:
    """
    Clean SCPI commands based on intent.
    
    For EXPLAIN_COMMAND intent: Remove leading colons for more natural explanations
    For other intents: Keep commands as-is
    
    Args:
        scpi_commands: List of extracted SCPI commands
        intent: The detected intent
        
    Returns:
        List of cleaned SCPI commands
    """
    if intent == Intent.EXPLAIN_COMMAND:
        cleaned = []
        for cmd in scpi_commands:
            # Remove leading colon for explain intent
            # ":MEAS:VOLT:DC?" -> "MEAS:VOLT:DC?"
            if cmd.startswith(':'):
                cleaned_cmd = cmd[1:]
                logger.debug(f"[EXPLAIN MODE] Cleaned SCPI: '{cmd}' -> '{cleaned_cmd}'")
                cleaned.append(cleaned_cmd)
            else:
                cleaned.append(cmd)
        return cleaned
    else:
        # For other intents, keep commands as-is
        return scpi_commands

def clean_text_for_intent(text: str, scpi_commands: List[str], intent: Intent) -> str:
    """
    Clean the original text based on intent.
    
    For EXPLAIN_COMMAND: Remove leading colons from SCPI commands in text
    For other intents: Keep text as-is
    
    Args:
        text: Original user input text
        scpi_commands: List of extracted SCPI commands
        intent: The detected intent
        
    Returns:
        Cleaned text
    """
    if intent == Intent.EXPLAIN_COMMAND:
        cleaned_text = text
        
        # Replace each SCPI command that starts with : in the text
        for cmd in scpi_commands:
            if cmd.startswith(':'):
                # Replace ":MEAS:VOLT?" with "MEAS:VOLT?" in the text
                cleaned_text = cleaned_text.replace(cmd, cmd[1:])
        
        logger.debug(f"[EXPLAIN MODE] Original text: '{text}'")
        logger.debug(f"[EXPLAIN MODE] Cleaned text: '{cleaned_text}'")
        return cleaned_text
    else:
        return text
    
def classify_intent_with_gemini(text: str, scpi_commands: List[str]) -> Tuple[Intent, float, str, Optional[List[str]]]:
    """
    Use Gemini to classify intent with reasoning.
    
    Returns:
        (Intent, confidence_score, reasoning, missing_info)
    """
    try:
        prompt = INTENT_DETECTION_PROMPT.format(
            user_text=text,
            scpi_commands=", ".join(scpi_commands) if scpi_commands else "None"
        )
        
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        
        # Remove markdown code fences if present
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
        
        result = json.loads(result_text.strip())
        
        intent_str = result.get("intent", "unclear")
        confidence = float(result.get("confidence", 0.0))
        reasoning = result.get("reasoning", "")
        missing_info = result.get("missing_info", None)
        
        # Map string to Intent enum
        try:
            intent = Intent(intent_str)
        except ValueError:
            logger.warning(f"Unknown intent returned: {intent_str}")
            intent = Intent.UNCLEAR
            
        logger.info(f"Gemini intent: {intent.value} ({confidence:.2f}) - {reasoning}")
        return intent, confidence, reasoning, missing_info
        
    except Exception as e:
        logger.error(f"Gemini intent detection failed: {e}")
        # Fallback to regex-based detection
        intent, confidence, reasoning = classify_intent_fallback(text, bool(scpi_commands))
        return intent, confidence, reasoning, None

def classify_intent_fallback(text: str, has_scpi: bool) -> Tuple[Intent, float, str]:
    """
    BALANCED fallback intent classification.
    
    Philosophy: Catch missing critical parameters (values, channels) but allow
                requests with sufficient context to proceed.
    """
    text_lower = text.lower()
    intent_scores = {intent: 0.0 for intent in Intent}
    
    # ========================================================================
    # STEP 0: CRITICAL PARAMETER DETECTION (NEW - HIGH PRIORITY)
    # ========================================================================
    # Check for actions that REQUIRE specific values/channels
    set_actions = ['set', 'configure', 'output', 'source', 'apply']
    measurement_actions = ['measure', 'read', 'monitor', 'test']
    
    has_set_action = any(action in text_lower for action in set_actions)
    has_measurement_action = any(action in text_lower for action in measurement_actions)
    
    # Check what's present
    has_value = bool(re.search(r'\d+(?:\.\d+)?\s*[vVaAmMuUkKΩωWHz]', text_lower))
    has_channel = bool(re.search(r'channel\s+\d+|ch\s*\d+|@\d{3}', text_lower))
    has_measurement_type = any(kw in text_lower for kw in 
                               ['voltage', 'current', 'resistance', 'frequency', 'temperature', 'power'])
    
    missing_items = []
    
    # RULE 1: "set/configure/output X" without VALUE
    if has_set_action and has_measurement_type and not has_value:
        if 'voltage' in text_lower:
            missing_items.append("voltage value (e.g., '12V', '5.5V')")
        elif 'current' in text_lower:
            missing_items.append("current value (e.g., '100mA', '1A')")
        elif 'frequency' in text_lower:
            missing_items.append("frequency value (e.g., '1kHz', '10MHz')")
        elif 'resistance' in text_lower:
            missing_items.append("resistance value (e.g., '100Ω', '1kΩ')")
    
    # RULE 2: "measure X" without CHANNEL (unless measuring general capability)
    if has_measurement_action and not has_channel:
        # Check if this is asking about capability vs actual measurement
        capability_words = ['can', 'able', 'support', 'possible', 'capability']
        is_capability_query = any(word in text_lower for word in capability_words)
        
        if not is_capability_query and has_measurement_type:
            missing_items.append("channel number (e.g., 'channel 101', '@101')")
    
    # RULE 3: "set/configure" with channel but no target
    if has_set_action and has_channel and not has_measurement_type and not has_value:
        missing_items.append("what to configure (voltage/current/etc.) and value")
    
    # RULE 4: "configure channel X" without measurement type
    if ('configure' in text_lower or 'setup' in text_lower) and has_channel and not has_measurement_type:
        missing_items.append("measurement type (e.g., 'voltage', 'current', 'resistance')")
    
    # RULE 5: "enable/disable output" without channel
    if ('enable' in text_lower or 'disable' in text_lower) and 'output' in text_lower and not has_channel:
        missing_items.append("output/channel number (e.g., 'channel 6')")
    
    # If critical info is missing, return UNCLEAR
    if missing_items:
        return (
            Intent.UNCLEAR, 
            0.85,
            f"Action detected but missing: {', '.join(missing_items)}"
        )
    
    # ========================================================================
    # STEP 1: Check for OFF_TOPIC
    # ========================================================================
    off_topic_indicators = {
        'greetings': ['hello', 'hi', 'hey', 'good morning'],
        'personal': ['how are you', 'feeling', 'tired'],
        'chitchat': ['joke', 'story', 'weather'],
    }
    
    off_topic_count = sum(
        1 for phrases in off_topic_indicators.values() 
        for phrase in phrases if phrase in text_lower
    )
    
    if off_topic_count >= 1 and not has_scpi:
        instrument_keywords = ['measure', 'voltage', 'current', 'channel', 'test', 'configure']
        if not any(kw in text_lower for kw in instrument_keywords):
            return Intent.OFF_TOPIC, 0.95, "Fallback: No instrument/testing context"
    
    # ========================================================================
    # STEP 2: Check existing intent patterns
    # ========================================================================
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                weight = 0.4 if intent == Intent.GENERATE_TEST else 0.3
                intent_scores[intent] += weight * len(matches)
    
    # ========================================================================
    # STEP 3: BOOST generate_test for complete actions
    # ========================================================================
    action_verbs = ['measure', 'set', 'configure', 'test', 'enable', 'disable', 
                    'output', 'read', 'check', 'monitor', 'scan']
    context_keywords = ['channel', 'voltage', 'current', 'resistance', 'frequency', 
                       'temperature', 'power', 'output', 'input']
    
    has_action = any(verb in text_lower for verb in action_verbs)
    has_context = has_scpi or any(kw in text_lower for kw in context_keywords)
    
    # Boost generate_test if action + context + sufficient params
    if has_action and has_context:
        # Check if it's a complete action (already passed param checks above)
        intent_scores[Intent.GENERATE_TEST] += 0.6
    
    # ========================================================================
    # STEP 4: Check for extremely vague requests
    # ========================================================================
    extremely_vague_patterns = [
    r'^\s*(do|make|create|help|test)\s*$',  # Single word only
    r'^\s*(do|test)\s+(it|this|that|something)\s*$',  # "test it"
    r'^\s*help\s+me\s*$',  # "help me" with no context
]

    
    is_extremely_vague = any(
        re.match(pattern, text_lower) 
        for pattern in extremely_vague_patterns
    )
    
    max_pattern_score = max(intent_scores.values()) if intent_scores else 0
    
    if is_extremely_vague and not has_action and not has_context and max_pattern_score < 0.3:
        intent_scores[Intent.UNCLEAR] = 0.7
    
    # ========================================================================
    # STEP 5: Determine final intent
    # ========================================================================
    max_score = max(intent_scores.values()) if intent_scores else 0
    
    # If no strong match but has action/context, check completeness
    if max_score < 0.3:
        if has_action and has_context:
            return Intent.GENERATE_TEST, 0.5, "Fallback: Action with context detected"
        
        instrument_keywords = ['measure', 'voltage', 'current', 'channel', 'test', 'instrument']
        if any(kw in text_lower for kw in instrument_keywords):
            return Intent.GENERATE_TEST, 0.4, "Fallback: Instrument-related request"
        else:
            return Intent.OFF_TOPIC, 0.7, "Fallback: No clear context"
    
    # Get best intent
    best_intent = max(intent_scores.items(), key=lambda x: x[1])
    confidence = min(best_intent[1], 1.0)
    
    # Generate reasoning
    reasoning_map = {
        Intent.GENERATE_TEST: "Fallback: Complete configuration/measurement action",
        Intent.EXPLAIN_COMMAND: "Fallback: Explanation requested",
        Intent.TROUBLESHOOT: "Fallback: Error/problem reported",
        Intent.UNCLEAR: "Fallback: Missing critical parameters",
        Intent.OFF_TOPIC: "Fallback: No instrument/testing context"
    }
    reasoning = reasoning_map.get(best_intent[0], "Fallback: Pattern-based classification")
    
    return best_intent[0], confidence, reasoning

# ============================================================================
# CLARIFICATION QUESTION GENERATION
# ============================================================================

def generate_clarification_question(text: str, missing_info: list = None, 
                                   parsed_data: Dict = None) -> str:
    """
    Generate a clarifying question based on what's missing.
    """
    text_lower = text.lower()
    
    # If Gemini provided specific missing info
    if missing_info:
        items = ', '.join(missing_info)
        return f"I need more details: **{items}**. Could you provide these?"
    
    # Pattern-based clarification with context awareness
    questions = []
    
    # Check what's already present
    has_channel = bool(re.search(r'channel|ch\s*\d+|@?\d{3}', text_lower))
    has_voltage_value = bool(re.search(r'\d+(?:\.\d+)?\s*[vV]', text_lower))
    has_current_value = bool(re.search(r'\d+(?:\.\d+)?\s*[mM]?[aA]', text_lower))
    
    if any(word in text_lower for word in ['measure', 'read', 'test']):
        if not has_channel:
            questions.append("**Which channel** should I use? (e.g., 'channel 101' or '@101')")
        
        if 'voltage' in text_lower and not has_voltage_value:
            questions.append("What **voltage range** are you expecting? (e.g., '10V' or 'AUTO')")
        
        if 'current' in text_lower and not has_current_value:
            questions.append("What **current range** are you expecting? (e.g., '1A' or '100mA')")
    
    if any(word in text_lower for word in ['set', 'configure', 'output', 'source']):
        if not (has_voltage_value or has_current_value):
            questions.append("What **value** should I set? (e.g., '12V' or '500mA')")
        
        if not has_channel and 'output' in text_lower:
            questions.append("Which **output/channel**?")
    
    # If still no specific questions, ask generally
    if not questions:
        return ("I understand you want to work with instruments, but I need more specifics. "
                "Could you provide details like:\n"
                "• Channel/output number\n"
                "• Measurement type (voltage/current/resistance)\n"
                "• Expected values or ranges")
    
    # Format questions nicely
    if len(questions) == 1:
        return questions[0]
    else:
        return "I need a few more details:\n• " + "\n• ".join(questions)

def handle_off_topic() -> str:
    """Simple response for off-topic queries."""
    return ("Hi! I'm a SCPI test automation assistant. I can help you:\n"
            "• Generate test sequences\n"
            "• Explain SCPI commands\n"
            "• Configure instruments\n"
            "• Troubleshoot test issues\n\n"
            "What would you like to test or configure?")

# ============================================================================
# Measurement/Condition Extraction
# ============================================================================

MEASUREMENT_TYPES = {
    "voltage": [r"\bvolt(?:age)?\b", r"\b\d+\s*[kKmMuUnN]?V\b", r"\bDC\b", r"\bAC\b"],
    "current": [r"\bcurrent\b", r"\bamp(?:ere)?(?:age)?\b", r"\b\d+\s*[kKmMuUnN]?A\b"],
    "resistance": [r"\bresist(?:ance)?\b", r"\bohm\b", r"\bΩ\b", r"\b\d+\s*[kKmM]?Ω\b"],
    "frequency": [r"\bfreq(?:uency)?\b", r"\b\d+\s*[kKmMgG]?Hz\b"],
    "temperature": [r"\btemp(?:erature)?\b", r"\b\d+\s*°?[CF]\b"],
    "power": [r"\bpower\b", r"\bwatt\b", r"\b\d+\s*[kKmMuUnN]?W\b"],
}

def extract_conditions(text: str) -> List[str]:
    """Extract measurement conditions (values with units)."""
    units = r"(?:[kKmMuUnNpP]?V|[kKmMuUnNpP]?A|°?[CF]|Ω|OHM|HZ|KHZ|MHZ|MA|UA|%)"
    pattern = fr"\b[-+]?\d+(?:\.\d+)?\s*{units}\b"
    return re.findall(pattern, text, flags=re.IGNORECASE)

def extract_target_context(text: str) -> List[str]:
    """Extract target equipment, channels, and contexts."""
    targets = set()
    targets.update(re.findall(r"\bchannel\s+\d+\b", text, flags=re.IGNORECASE))
    targets.update(re.findall(r"\bch\s*\d+\b", text, flags=re.IGNORECASE))
    targets.update(re.findall(r"\bfor\s+\w+(?:\s+\w+)?\b", text, flags=re.IGNORECASE))
    return sorted(targets)

def extract_measurement_types(text: str) -> List[str]:
    """Identify measurement types."""
    found = []
    text_lower = text.lower()
    for meas_type, patterns in MEASUREMENT_TYPES.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                found.append(meas_type)
                break
    return found

def extract_equipment_refs(text: str) -> List[str]:
    """Extract equipment references."""
    patterns = [
        r"\b(?:keysight|agilent|fluke|tektronix|rigol)\b",
        r"\b(?:34[0-9]{3}[A-Z]?|DAQ\d+)\b",
        r"\b(?:DMM|multimeter|oscilloscope)\b",
    ]
    refs = []
    for pattern in patterns:
        refs.extend(re.findall(pattern, text, flags=re.IGNORECASE))
    return list(set(refs))

def extract_temporal_info(text: str) -> List[str]:
    """Extract timing information."""
    pattern = r"\b\d+\s*(?:ns|us|ms|s|min|h|second|minute|hour)\b"
    return re.findall(pattern, text, flags=re.IGNORECASE)

def extract_action_verbs(doc) -> List[str]:
    """Extract action verbs from spaCy doc."""
    return [tok.lemma_ for tok in doc if tok.pos_ == "VERB" and not tok.is_stop]

def _dedup_targets(targets: List[str]) -> List[str]:
    """Remove redundant substring targets."""
    unique = []
    for t in targets:
        if not any(t != o and t in o for o in targets):
            unique.append(t)
    return unique

# ============================================================================
# MAIN PREPROCESSING FUNCTION
# ============================================================================

def preprocess_input(text: str, use_gemini: bool = True) -> ParsedInput:
 
    original = text.strip()
    
    # 1) Extract measurements FIRST (before any text modification)
    conditions = extract_conditions(original)
    measurement_types = extract_measurement_types(original)
    
    # 2) Extract SCPI commands (with improved detection)
    scpi_cmds = extract_scpi_commands_from_text(original)
    
    
    # 3) Classify intent
    missing_info = None
    if use_gemini:
        intent, confidence, reasoning, missing_info = classify_intent_with_gemini(original, scpi_cmds)
    else:
        intent, confidence, reasoning = classify_intent_fallback(original, bool(scpi_cmds))
    
    scpi_cmds = clean_scpi_for_intent(scpi_cmds, intent)
    cleaned_original = clean_text_for_intent(original, scpi_cmds, intent)
    # 4) Remove SCPI commands for further NLP processing
    text_wo_scpi = original
    for cmd in scpi_cmds:
        # Remove the command (handle both with and without leading :)
        cmd_pattern = cmd.lstrip(':')
        text_wo_scpi = re.sub(r'\b' + re.escape(cmd_pattern) + r'\b', " ", 
                              text_wo_scpi, flags=re.IGNORECASE)
    
    # 5) Extract other structured information
    targets = _dedup_targets(extract_target_context(text_wo_scpi))
    equipment_refs = extract_equipment_refs(text_wo_scpi)
    temporal_info = extract_temporal_info(text_wo_scpi)
    
    # 6) SpaCy processing
    doc = nlp(text_wo_scpi.lower())
    action_verbs = extract_action_verbs(doc)
    tokens = [tok.lemma_ for tok in doc if not (tok.is_punct or tok.is_space)]
    lemmatized = " ".join(tokens)
    
    logger.info(f"Intent: {intent.value} ({confidence:.2f})")
    logger.info(f"SCPI Commands: {scpi_cmds}")
    logger.debug(f"Measurements: {measurement_types}, Conditions: {conditions}")
    
    return ParsedInput(
        original_text=cleaned_original ,
        lemmatized_text=lemmatized,
        intent=intent,
        confidence=confidence,
        scpi_commands=scpi_cmds,
        conditions=conditions,
        targets=targets,
        action_verbs=action_verbs,
        measurement_types=measurement_types,
        equipment_refs=equipment_refs,
        temporal_info=temporal_info,
        intent_reasoning=reasoning,
        missing_info=missing_info
    )
    
def is_skip_command(text: str) -> bool:
    """
    Detect if user wants to skip clarification and proceed anyway.
    """
    skip_patterns = [
        r'^\s*skip\s*$',
        r'^\s*skip\s+clarification\s*$',
        r'^\s*continue\s*$',
        r'^\s*proceed\s*$',
        r'^\s*go\s+ahead\s*$',
        r'^\s*just\s+proceed\s*$',
        r'^\s*use\s+defaults?\s*$',
    ]
    
    text_lower = text.lower().strip()
    return any(re.match(pattern, text_lower) for pattern in skip_patterns)

def should_send_to_llm(intent: Intent) -> bool:
    """Decide if this request should go to your main LLM."""
    return intent in [
    Intent.GENERATE_TEST,
    Intent.EXPLAIN_COMMAND,
    Intent.MODIFY_SEQUENCE,
    Intent.TROUBLESHOOT,
    Intent.QUERY_CAPABILITY
    ]
def process_user_input(text: str, session_id: str = "default") -> dict:
    """
    Main processing flow with context-aware clarification.
    Detects if user starts a new query instead of answering clarification.
    Args:
        text: User input
        session_id: Unique session identifier (user_id, conversation_id, etc.)

    Returns:
        dict with action and relevant data
    """
    ctx = context_manager.get_context(session_id)
    ctx.update_timestamp()
    if is_skip_command(text):
        if ctx.awaiting_clarification:
            logger.info(f"User requested skip clarification for session {session_id}")
            
            # Force classify as generate_test and proceed
            combined_text = ctx.original_query  # Use original incomplete query
            parsed = preprocess_input(combined_text, use_gemini=False)  # Use fallback
            
            # Override intent to generate_test
            parsed.intent = Intent.GENERATE_TEST
            parsed.confidence = 0.6  # Lower confidence since info is missing
            parsed.intent_reasoning = "User skipped clarification, proceeding with available info"
            
            ctx.reset()
            
            return {
                "action": "process_with_llm",
                "parsed_data": parsed.to_dict(),
                "combined_query": combined_text,
                "send_to_llm": True,
                "skipped_clarification": True  # Flag for LLM to know
            }
        else:
            # No clarification pending, treat as normal input
            logger.info("Skip command received but no clarification pending")
    # If we're awaiting clarification, check if user is answering or asking something new
    if ctx.awaiting_clarification:
        # Detect if this is a NEW query instead of clarification answer
        if is_new_query(text, ctx.original_query):
            logger.info(f"Detected NEW query, resetting context for session {session_id}")
            ctx.reset()
            # Process as a fresh query (continue to normal flow below)
        else:
            # User is providing clarification - combine queries
            logger.info(f"Detected clarification answer for session {session_id}")
            combined_text = context_manager.combine_queries(ctx.original_query, text)
            logger.debug(f"Combined query: '{combined_text}'")
            
            # Process the combined query
            parsed = preprocess_input(combined_text)
            
            # Check if still unclear
            if parsed.intent == Intent.UNCLEAR:
                ctx.clarification_count += 1
                
                # Prevent infinite clarification loop
                if ctx.clarification_count >= 3:
                    ctx.reset()
                    return {
                        "action": "clarification_failed",
                        "response": ("I'm having trouble understanding the complete requirement. "
                                "Could you provide a full description? For example:\n"
                                "• 'Measure DC voltage on channel 101 with 10V range'\n"
                                "• 'Set output to 12V on channel 6 for fan test'"),
                        "send_to_llm": False
                    }
                
                # Ask for more clarification
                question = generate_clarification_question(
                    combined_text,
                    parsed.missing_info,
                    parsed.to_dict()
                )
                
                ctx.original_query = combined_text  # Update with combined version
                
                return {
                    "action": "ask_clarification",
                    "question": question,
                    "send_to_llm": False,
                    "context": ctx.to_dict()
                }
            
            # Success! Clear context and process
            ctx.reset()
            
            if parsed.intent == Intent.OFF_TOPIC:
                return {
                    "action": "respond_directly",
                    "response": handle_off_topic(),
                    "send_to_llm": False
                }
            
            return {
                "action": "process_with_llm",
                "parsed_data": parsed.to_dict(),
                "combined_query": combined_text,
                "send_to_llm": True
            }

# First-time processing (no pending clarification)
    parsed = preprocess_input(text)

    if parsed.intent == Intent.OFF_TOPIC:
        return {
            "action": "respond_directly",
            "response": handle_off_topic(),
            "send_to_llm": False
        }

    elif parsed.intent == Intent.UNCLEAR:
        # Set up clarification context
        ctx.original_query = text
        ctx.awaiting_clarification = True
        ctx.clarification_count = 1
        ctx.partial_parsed_data = parsed.to_dict()
        
        question = generate_clarification_question(
            text,
            parsed.missing_info,
            parsed.to_dict()
        )
        question += "\n\n_Type **'skip'** if you want to proceed without these details._"
        
        return {
            "action": "ask_clarification",
            "question": question,
            "send_to_llm": False,
            "context": ctx.to_dict()
        }

    else:  # Clear intent - process immediately
        ctx.reset()  # Ensure clean state
        return {
            "action": "process_with_llm",
            "parsed_data": parsed.to_dict(),
            "send_to_llm": True
        }
# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    test_cases = [
        # Without leading colon
        "Enable output OUTP ON, set voltage to 12 V on channel 6 for fan test.",
        "Measure voltage using MEAS:VOLT? on channel 101",
        "Configure CONF:VOLT:DC 10,0.001 and read",
        "Set SOUR:VOLT 5.0 then enable OUTP ON",
        
        # # With leading colon
        # "Enable output :OUTP ON, set voltage to 12 V",
        # "Use :MEAS:VOLT? to measure",
        
        # # Common commands
        # "Send *RST and *CLS before testing",
        # "Query *IDN? to identify device",
        
        # # Mixed
        # "CONF:VOLT:DC then MEAS:VOLT? and log to file",
        # "Set voltage SOUR:VOLT 3.3, read current MEAS:CURR?",
    ]
    
    print("SCPI Command Extraction Tests")
    print("=" * 80)
    
    for test in test_cases:
        print(f"\n{'='*60}")
        print(f"Input: {test}")
        result = preprocess_input(test)
        print(f"Intent: {result.intent.value} ({result.confidence:.2f})")
        print(f"Reasoning: {result.intent_reasoning}")
        print(f"SCPI: {result.scpi_commands}")
        print(f"Measurements: {result.measurement_types}")
        print(f"Conditions: {result.conditions}")
        print(f"Target: {result.targets}")
        