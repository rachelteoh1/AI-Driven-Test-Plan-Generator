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
        
        # Validate if it's actually SCPI
        if is_likely_scpi(matched_text, text):
            # Normalize the command
            cmd = matched_text.upper().rstrip(',;')
            
            if cmd not in seen:
                commands.append(cmd)
                seen.add(cmd)
                logger.debug(f"Extracted SCPI: {cmd}")
    
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
    OFF_TOPIC = "off_topic"          # Not about instruments/SCPI

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

1. **generate_test**: User wants to create/generate a new test sequence, configure equipment, or automate measurements
   - Examples: "measure voltage", "set output to 12V", "create a test for...", "configure channel 1"

2. **explain_command**: User wants to understand what a command does or how something works
   - Examples: "what does :OUTP do?", "explain MEAS:VOLT?", "how does this command work?"

3. **modify_sequence**: User wants to change/update an existing test sequence
   - Examples: "change the voltage to 15V", "add a delay", "remove step 3", "replace with..."

4. **troubleshoot**: User is reporting errors or problems
   - Examples: "error on line 5", "command not working", "why is this failing?", "debug this"

5. **query_capability**: User is asking if something is possible or supported
   - Examples: "can I measure current?", "does it support frequency?", "is it possible to...?"

6. **unclear**: Request is about instruments/testing but lacks critical details
   - Examples: "measure voltage" (no channel), "set output" (no value), "test the device" (no specifics)

7. **off_topic**: Request is NOT about test automation, instruments, or SCPI
   - Examples: "hello", "how are you?", "tell me a joke", "what's the weather?", "I'm feeling sad"

User Request: "{user_text}"

SCPI Commands Found: {scpi_commands}

Respond ONLY with valid JSON in this exact format:
{{
  "intent": "generate_test",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why you chose this intent",
  "missing_info": ["channel number", "voltage range"]
}}

Note: Only include "missing_info" array if intent is "unclear". Otherwise omit it or set to null.

JSON Response:"""

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
    Enhanced fallback intent classification with UNCLEAR and OFF_TOPIC detection.
    
    Args:
        text: User input text
        has_scpi: Whether SCPI commands were detected
    
    Returns:
        (Intent, confidence_score, reasoning)
    """
    text_lower = text.lower()
    intent_scores = {intent: 0.0 for intent in Intent}
    
    # ========================================================================
    # STEP 1: Check for OFF_TOPIC first (highest priority)
    # ========================================================================
    off_topic_indicators = {
        'greetings': ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
        'personal': ['how are you', 'what\'s up', 'how\'s it going', 'feeling', 'tired', 'hungry'],
        'chitchat': ['joke', 'story', 'weather', 'news', 'tell me about'],
        'general_questions': ['who are you', 'what can you do', 'help me with'],
    }
    
    # Count off-topic matches
    off_topic_count = 0
    for category, phrases in off_topic_indicators.items():
        for phrase in phrases:
            if phrase in text_lower:
                off_topic_count += 1
    
    # Check if text is very short and generic
    words = text_lower.split()
    is_very_short = len(words) <= 3
    
    # Strong off-topic indicators
    if off_topic_count >= 1 and not has_scpi:
        # Check if it contains any instrument-related keywords
        instrument_keywords = [
            'measure', 'voltage', 'current', 'channel', 'output', 'input',
            'configure', 'set', 'test', 'scpi', 'instrument', 'dmm', 'multimeter',
            'resistance', 'frequency', 'temperature', 'power'
        ]
        
        has_instrument_context = any(kw in text_lower for kw in instrument_keywords)
        
        if not has_instrument_context:
            return Intent.OFF_TOPIC, 0.95, "Fallback: No instrument/testing context detected"
    
    # Very short generic phrases without context
    if is_very_short and off_topic_count > 0:
        return Intent.OFF_TOPIC, 0.90, "Fallback: Generic greeting/chitchat"
    
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
    # STEP 3: Boost GENERATE_TEST for configuration requests
    # ========================================================================
    config_keywords = ['enable', 'set', 'configure', 'turn', 'measure', 'output', 'source']
    context_keywords = ['channel', 'output', 'voltage', 'current', 'resistance', 'frequency']
    
    has_config = any(word in text_lower for word in config_keywords)
    has_context = has_scpi or any(word in text_lower for word in context_keywords)
    
    if has_config and has_context:
        intent_scores[Intent.GENERATE_TEST] += 0.5
    
    # ========================================================================
    # STEP 4: Detect UNCLEAR intent (missing critical information)
    # ========================================================================
    # Check for action verbs that require details
    action_verbs = ['measure', 'set', 'configure', 'test', 'enable', 'disable', 'output']
    has_action = any(verb in text_lower for verb in action_verbs)
    
    # Check for critical details
    has_channel = bool(re.search(r'channel|ch\s*\d+|@\d{3}', text_lower))
    has_value = bool(re.search(r'\d+(?:\.\d+)?\s*[vVaAmMΩ]', text_lower))
    has_specific_measurement = any(word in text_lower for word in ['voltage', 'current', 'resistance', 'frequency', 'temperature'])
    
    # If user has action but missing details AND no strong pattern match
    max_pattern_score = max(intent_scores.values()) if intent_scores else 0
    
    if has_action and max_pattern_score < 0.4:
        # Determine what's missing
        missing_count = 0
        
        if 'measure' in text_lower or 'test' in text_lower:
            if not has_channel:
                missing_count += 1
            if not has_specific_measurement:
                missing_count += 1
        
        if 'set' in text_lower or 'configure' in text_lower or 'output' in text_lower:
            if not has_value:
                missing_count += 1
            if not has_channel and 'output' in text_lower:
                missing_count += 1
        
        # If missing 2+ critical pieces of info, mark as UNCLEAR
        if missing_count >= 2:
            intent_scores[Intent.UNCLEAR] = 0.7
        elif missing_count == 1:
            intent_scores[Intent.UNCLEAR] = 0.5
    
    # Special case: Very vague requests
    vague_patterns = [
        r'^(measure|test|set|configure|enable|disable)\s*$',  # Single word only
        r'^(measure|test|set)\s+(it|this|that|something)\s*$',  # "measure it"
    ]
    
    for pattern in vague_patterns:
        if re.search(pattern, text_lower):
            intent_scores[Intent.UNCLEAR] = 0.8
            break
    
    # ========================================================================
    # STEP 5: Determine final intent
    # ========================================================================
    max_score = max(intent_scores.values()) if intent_scores else 0
    
    # If no pattern matched well and has instrument context but vague
    if max_score < 0.2:
        # Check if it's instrument-related but incomplete
        instrument_keywords = ['measure', 'voltage', 'current', 'channel', 'output', 
                             'configure', 'set', 'test', 'instrument']
        has_instrument_mention = any(kw in text_lower for kw in instrument_keywords)
        
        if has_instrument_mention:
            return Intent.UNCLEAR, 0.6, "Fallback: Instrument-related but missing details"
        else:
            return Intent.OFF_TOPIC, 0.7, "Fallback: No clear instrument/testing context"
    
    # Get best intent
    best_intent = max(intent_scores.items(), key=lambda x: x[1])
    confidence = min(best_intent[1], 1.0)
    
    # Generate reasoning
    if best_intent[0] == Intent.GENERATE_TEST:
        reasoning = "Fallback: Detected configuration keywords and context"
    elif best_intent[0] == Intent.EXPLAIN_COMMAND:
        reasoning = "Fallback: Detected explanation/query keywords"
    elif best_intent[0] == Intent.TROUBLESHOOT:
        reasoning = "Fallback: Detected error/problem keywords"
    elif best_intent[0] == Intent.UNCLEAR:
        reasoning = "Fallback: Action detected but missing critical details"
    elif best_intent[0] == Intent.OFF_TOPIC:
        reasoning = "Fallback: No instrument/testing context found"
    else:
        reasoning = "Fallback: Pattern-based classification"
    
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
    """
    Preprocess user input and extract structured information.
    
    Args:
        text: Raw user input
        use_gemini: Whether to use Gemini for intent classification (default True)
    
    Returns:
        ParsedInput object with all extracted information
    """
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
        original_text=original,
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
        
if __name__ == "__main__":
    print("="*80)
    print("CONVERSATION FLOW DEMONSTRATION")
    print("="*80)
    # Scenario 1: Unclear -> Clarification -> Success
    print("\n📌 Scenario 1: User provides incomplete info, then clarifies")
    print("-" * 60)

    session = "user_123"

    # result1 = process_user_input("measure voltage", session)
    # print(f"User: 'measure voltage'")
    # print(f"Bot Action: {result1['action']}")
    # if result1['action'] == 'ask_clarification':
    #     print(f"Bot: {result1['question']}\n")

    # result2 = process_user_input("channel 101, 10V range", session)
    # print(f"User: 'channel 101, 10V range'")
    # print(f"Action: {result2['action']}")
    # if result2.get('combined_query'):
    #     print(f"Combined Query: '{result2['combined_query']}'")
    # print(f"Send to LLM: {result2['send_to_llm']}")

    # # Scenario 2: Multiple clarifications
    # print("\n\n📌 Scenario 2: Multiple clarification rounds")
    # print("-" * 60)

    # session2 = "user_456"

    # result1 = process_user_input("set output", session2)
    # print(f"User: 'set output'")
    # if result1['action'] == 'ask_clarification':
    #     print(f"Bot: {result1['question']}\n")

    # result2 = process_user_input("12V", session2)
    # print(f"User: '12V'")
    # if result2['action'] == 'ask_clarification':
    #     print(f"Bot: {result2['question']}\n")
        
    #     result3 = process_user_input("channel 6", session2)
    #     print(f"User: 'channel 6'")
    #     print(f"Action: {result3['action']}")
    #     if result3.get('combined_query'):
    #         print(f"Combined Query: '{result3['combined_query']}'")
    #     print(f"Send to LLM: {result3['send_to_llm']}")

    # Scenario 3: Clear from the start
    # print("\n\n📌 Scenario 3: Complete info provided immediately")
    # print("-" * 60)

    # session3 = "user_789"
    # result = process_user_input("measure voltage on channel 101 with 10V range", session3)
    # print(f"User: 'measure voltage on channel 101 with 10V range'")
    # print(f"Action: {result['action']}")
    # print(f"Send to LLM: {result['send_to_llm']}")
    # print(f"Intent: {result['parsed_data']['intent']}")

    # # Scenario 4: Off-topic
    # print("\n\n📌 Scenario 4: Off-topic conversation")
    # print("-" * 60)

    # session4 = "user_abc"
    # result = process_user_input("Hello! How are you?", session4)
    # print(f"User: 'Hello! How are you?'")
    # print(f"Action: {result['action']}")
    # print(f"Bot: {result['response'][:100]}...")

    # # Scenario 5: User ignores clarification and asks new question
    # print("\n\n📌 Scenario 5: User ignores clarification (starts new query)")
    # print("-" * 60)

    # session5 = "user_xyz"

    # result1 = process_user_input("measure voltage", session5)
    # print(f"User: 'measure voltage'")
    # if result1['action'] == 'ask_clarification':
    #     print(f"Bot: {result1['question']}\n")

    # # User ignores the clarification and asks something completely different
    # result2 = process_user_input("explain what :OUTP ON does", session5)
    # print(f"User: 'explain what :OUTP ON does' (NEW QUERY - ignored clarification)")
    # print(f"Action: {result2['action']}")
    # print(f"Intent: {result2['parsed_data']['intent']}")
    # print(f"Send to LLM: {result2['send_to_llm']}")
    # print(f"Context was reset: {result2.get('combined_query') is None}")

    # Scenario 6: User provides partial clarification, then asks new question
    print("\n\n📌 Scenario 6: Partial clarification, then new query")
    print("-" * 60)

    session6 = "user_def"

    result1 = process_user_input("set output", session6)
    print(f"User: 'set output'")
    if result1['action'] == 'ask_clarification':
        print(f"Bot: {result1['question']}\n")

    result2 = process_user_input("12V", session6)
    print(f"User: '12V' (clarification answer)")
    if result2['action'] == 'ask_clarification':
        print(f"Bot: {result2['question']}\n")
        
        # User gets impatient and asks something else
        result3 = process_user_input("can you measure current instead?", session6)
        print(f"User: 'can you measure current instead?' (NEW QUERY)")
        print(f"Action: {result3['action']}")
        print(f"Intent: {result3['parsed_data']['intent']}")
        combined_query = result3.get('combined_query', '')
        print(f"Context was reset: {not combined_query.startswith('set output')}")