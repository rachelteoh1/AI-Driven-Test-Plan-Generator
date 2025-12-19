# # nlp_utils.py  – SCPI/intent pre‑processing  (Option A: keep arguments intact)

# import re
# import spacy
# import logging

# logger = logging.getLogger(__name__)

# nlp = spacy.load("en_core_web_lg")        # load once at module import



# SCPI_REGEX = re.compile(
#     r"""
#     (?<!\S)                                      # token boundary
#     (?:                                          # ── 3 forms ───────────────────
#         \*[A-Z]+                                 #  *IDN, *RST  …
#       |                                          #  OR
#         :[A-Z]+(?:\*?[A-Z]+)*(?::[A-Z]+(?:\*?[A-Z]+)*)*  #  :MEAS:VOLT …
#       |                                          #  OR
#         [A-Z]+(?:\*?[A-Z]+)*(?::[A-Z]+(?:\*?[A-Z]+)*)+   #  ROUT:SCAN …
#     )
#     \??                                          # optional query mark
#     (?:                                          # optional argument section
#         \s+[^()\s]+                              #   space + simple arg  (10V)
#       | \s*\([^)]*\)                             #   ( 1,2,3 )
#       | \s*@\([^)]*\)                            #   @ (101:110)
#     )?
#     (?=\s|$)                                     # token boundary
#     """,
#     re.VERBOSE | re.IGNORECASE,
# )


# def _norm(cmd: str) -> str:
#     """Return command in canonical upper‑case form, always starting with ':' or '*'."""
#     cmd = cmd.upper().strip()
#     return cmd if cmd.startswith((':', '*')) else ':' + cmd


# def extract_scpi_commands_from_text(text: str) -> list[str]:
#     """Return a list of unique SCPI commands found in *text*, with arguments preserved."""
#     commands = {_norm(m.group(0)) for m in SCPI_REGEX.finditer(text)}
#     logger.debug(f"Extracted SCPI commands: {commands}")
#     return list(commands)



# def extract_conditions(text: str) -> list[str]:
#     units = r"(?:[kMmunp]?V|[kMmunp]?A|°?C|°?F|Ω|OHM|HZ|KHZ|MA|UA|%)"
#     pattern = fr"\b[-+]?\d*\.?\d+\s?{units}\b"
#     return re.findall(pattern, text, flags=re.IGNORECASE)


# def extract_target_context(text: str) -> list[str]:
#     targets: set[str] = set()
#     targets.update(re.findall(r"\bchannel\s+\d+\b", text, flags=re.IGNORECASE))
#     targets.update(re.findall(r"\bfor\s+\w+\b", text, flags=re.IGNORECASE))
#     targets.update(re.findall(r"\bon\s+(?:channel\s+\d+|\w+(?:\s+\w+)?)",
#                               text, flags=re.IGNORECASE))
#     return sorted(targets)


# def _dedup_targets(targets: list[str]) -> list[str]:
#     """Drop targets that are substrings of longer targets to remove redundancy."""
#     unique = []
#     for t in targets:
#         if not any(t != o and t in o for o in targets):
#             unique.append(t)
#     return unique


# def preprocess_input(text: str):
#     """
#     Returns:
#         lemmatized_text : str
#         scpi_commands   : list[str]
#         conditions      : list[str]
#         targets         : list[str]
#     """
#     original = text.strip()

#     # 1) SCPI
#     scpi_cmds = extract_scpi_commands_from_text(original)

#     # 2) Remove those commands from the text before further NLP
#     text_wo_scpi = original
#     for cmd in scpi_cmds:
#         text_wo_scpi = re.sub(re.escape(cmd), " ", text_wo_scpi, flags=re.IGNORECASE)

#     # 3) Other NLP entities
#     conditions = extract_conditions(text_wo_scpi)
#     targets    = _dedup_targets(extract_target_context(text_wo_scpi))

#     # 4) Lemmatise remaining words
#     tokens = [tok.lemma_ for tok in nlp(text_wo_scpi.lower())
#               if not (tok.is_punct or tok.is_space)]
#     lemmatised = " ".join(tokens)

#     logger.debug(f"Lemmatized text: {lemmatised}")
#     return lemmatised, scpi_cmds, conditions, targets

# nlp_utils.py – Enhanced SCPI/intent pre-processing
import re
import spacy
import logging
from enum import Enum
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)
nlp = spacy.load("en_core_web_lg")

# ============================================================================
# ENHANCED SCPI REGEX with better argument capturing
# ============================================================================
SCPI_REGEX = re.compile(
    r"""
    (?<!\S)                                      # token boundary
    (?:                                          # ── 3 forms ───────────────────
        \*[A-Z]+                                 #  *IDN, *RST  …
        |                                        #  OR
        :[A-Z]+(?:\*?[A-Z]+)*(?::[A-Z]+(?:\*?[A-Z]+)*)*  #  :MEAS:VOLT …
        |                                        #  OR
        [A-Z]+(?:\*?[A-Z]+)*(?::[A-Z]+(?:\*?[A-Z]+)*)+   #  ROUT:SCAN …
    )
    \??                                          # optional query mark
    (?:                                          # optional argument section
        \s+[^()\s,;]+                            #   space + simple arg (10V, DEF, MIN, MAX)
        | \s*\([^)]*\)                           #   ( 1,2,3 )
        | \s*@\([^)]*\)                          #   @ (101:110)
        | \s*,\s*[^,;()\s]+                      #   comma-separated args
    )*                                           # allow multiple arguments
    (?=\s|$|;)                                   # token boundary or semicolon
    """,
    re.VERBOSE | re.IGNORECASE,
)

# ============================================================================
# INTENT CLASSIFICATION
# ============================================================================
class Intent(Enum):
    """User intent categories"""
    GENERATE_TEST = "generate_test"           # Generate test sequence
    EXPLAIN_COMMAND = "explain_command"       # Explain SCPI commands
    MODIFY_SEQUENCE = "modify_sequence"       # Modify existing sequence
    TROUBLESHOOT = "troubleshoot"             # Debug/fix issues
    QUERY_CAPABILITY = "query_capability"     # Ask about capabilities
    UNKNOWN = "unknown"

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
    
    def to_dict(self) -> Dict:
        return {
            "original_text": self.original_text,
            "lemmatized_text": self.lemmatized_text,
            "intent": self.intent.value,
            "confidence": self.confidence,
            "scpi_commands": self.scpi_commands,
            "conditions": self.conditions,
            "targets": self.targets,
            "action_verbs": self.action_verbs,
            "measurement_types": self.measurement_types,
            "equipment_refs": self.equipment_refs,
            "temporal_info": self.temporal_info
        }

# ============================================================================
# INTENT DETECTION PATTERNS
# ============================================================================
INTENT_PATTERNS = {
    Intent.GENERATE_TEST: [
        r"\b(generate|create|write|build|make|produce|develop)\b.*\b(test|sequence|script|program)\b",
        r"\b(automate|automation)\b",
        r"\b(measure|test|configure|setup|set up)\b.*\b(using|with|for)\b",
        r"\btest\s+(?:sequence|script|automation)\b",
        r"\b(?:i\s+)?(?:want|need|require)\s+(?:to\s+)?(?:test|measure|configure)\b"
    ],
    Intent.EXPLAIN_COMMAND: [
        r"\b(explain|describe|what\s+(?:does|is|are)|meaning|clarify|interpret)\b",
        r"\bhow\s+(?:does|do)\b.*\bwork\b",
        r"\bwhat\s+(?:does|is)\b.*\b(?:command|do|mean)\b",
        r"\bsyntax\s+(?:of|for)\b",
        r"^:[A-Z]+",  # Starts with SCPI command
        r"^\*[A-Z]+"  # Starts with common command
    ],
    Intent.MODIFY_SEQUENCE: [
        r"\b(modify|change|update|edit|alter|adjust|revise)\b",
        r"\b(add|remove|delete|insert)\b.*\b(command|step|line)\b",
        r"\breplace\b",
        r"\b(?:instead|rather)\s+(?:of|than)\b"
    ],
    Intent.TROUBLESHOOT: [
        r"\b(error|fail|not\s+work|issue|problem|wrong|debug|fix)\b",
        r"\b(troubleshoot|diagnose)\b",
        r"\bwhy\s+(?:is|does|did)\b.*\bnot\b",
        r"\b(?:doesn't|don't|didn't|won't)\s+work\b"
    ],
    Intent.QUERY_CAPABILITY: [
        r"\b(can|could|able|possible)\b.*\b(do|measure|test|configure)\b",
        r"\b(support|compatible|capability|feature)\b",
        r"\b(?:is\s+it\s+)?possible\s+to\b",
        r"\bdoes\s+(?:it|this|the\s+\w+)\s+support\b"
    ]
}

# ============================================================================
# MEASUREMENT TYPE DETECTION
# ============================================================================
MEASUREMENT_TYPES = {
    "voltage": [r"\bvolt(?:age)?\b", r"\bV\b", r"\bDC\b", r"\bAC\b"],
    "current": [r"\bcurrent\b", r"\bamp(?:ere)?(?:age)?\b", r"\bA\b"],
    "resistance": [r"\bresist(?:ance)?\b", r"\bohm\b", r"\bΩ\b"],
    "frequency": [r"\bfreq(?:uency)?\b", r"\bHz\b"],
    "temperature": [r"\btemp(?:erature)?\b", r"\b°?[CF]\b"],
    "power": [r"\bpower\b", r"\bwatt\b", r"\bW\b"],
    "continuity": [r"\bcontinuity\b", r"\bshort\b"],
    "capacitance": [r"\bcap(?:acitance)?\b", r"\bfarad\b", r"\bF\b"],
    "period": [r"\bperiod\b"],
    "duty_cycle": [r"\bduty\s+cycle\b"]
}

# ============================================================================
# EQUIPMENT REFERENCES
# ============================================================================
EQUIPMENT_PATTERNS = [
    r"\b(?:keysight|agilent|fluke|tektronix|rigol)\b",
    r"\b(?:34[0-9]{3}[A-Z]?|DAQ\d+)\b",  # Model numbers
    r"\b(?:DMM|multimeter|oscilloscope|function\s+generator|power\s+supply)\b",
    r"\bchannel\s+\d+\b",
    r"\binput\s+\d+\b"
]

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _norm(cmd: str) -> str:
    """Return command in canonical upper-case form, always starting with ':' or '*'."""
    cmd = cmd.upper().strip()
    return cmd if cmd.startswith((':', '*')) else ':' + cmd

def classify_intent(text: str, has_scpi: bool) -> Tuple[Intent, float]:
    """
    Classify user intent with confidence score.
    
    Returns:
        (Intent, confidence_score)
    """
    text_lower = text.lower()
    intent_scores = {intent: 0.0 for intent in Intent}
    
    # If text starts with SCPI commands, likely explanation
    if has_scpi and re.match(r"^\s*[:*][A-Z]", text):
        intent_scores[Intent.EXPLAIN_COMMAND] = 0.9
    
    # Check patterns for each intent
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                intent_scores[intent] += 0.3 * len(matches)
    
    # Normalize scores
    max_score = max(intent_scores.values()) if intent_scores else 0
    
    if max_score == 0:
        return Intent.UNKNOWN, 0.0
    
    # Get intent with highest score
    best_intent = max(intent_scores.items(), key=lambda x: x[1])
    confidence = min(best_intent[1], 1.0)  # Cap at 1.0
    
    return best_intent[0], confidence

def extract_scpi_commands_from_text(text: str) -> List[str]:
    """Return a list of unique SCPI commands found in text, with arguments preserved."""
    commands = {_norm(m.group(0)) for m in SCPI_REGEX.finditer(text)}
    logger.debug(f"Extracted SCPI commands: {commands}")
    return sorted(commands)

def extract_conditions(text: str) -> List[str]:
    """Extract measurement conditions (values with units)."""
    units = r"(?:[kMmunp]?V|[kMmunp]?A|°?[CF]|Ω|OHM|HZ|KHZ|MHZ|MA|UA|%|S|MS|US)"
    pattern = fr"\b[-+]?\d*\.?\d+\s?{units}\b"
    conditions = re.findall(pattern, text, flags=re.IGNORECASE)
    
    # Also extract range specifications
    range_pattern = r"\b(?:from|between)\s+[-+]?\d*\.?\d+.*?(?:to|and)\s+[-+]?\d*\.?\d+"
    ranges = re.findall(range_pattern, text, flags=re.IGNORECASE)
    
    return conditions + ranges

def extract_target_context(text: str) -> List[str]:
    """Extract target equipment, channels, and contexts."""
    targets: set[str] = set()
    
    # Channel references
    targets.update(re.findall(r"\bchannel\s+\d+\b", text, flags=re.IGNORECASE))
    targets.update(re.findall(r"\bch\s*\d+\b", text, flags=re.IGNORECASE))
    targets.update(re.findall(r"\b@\([^)]+\)", text, flags=re.IGNORECASE))
    
    # Contextual targets
    targets.update(re.findall(r"\bfor\s+\w+\b", text, flags=re.IGNORECASE))
    targets.update(re.findall(r"\bon\s+(?:channel\s+\d+|\w+(?:\s+\w+)?)", 
                              text, flags=re.IGNORECASE))
    targets.update(re.findall(r"\busing\s+\w+(?:\s+\w+)?", text, flags=re.IGNORECASE))
    
    return sorted(targets)

def extract_measurement_types(text: str) -> List[str]:
    """Identify types of measurements mentioned."""
    found_types = []
    text_lower = text.lower()
    
    for meas_type, patterns in MEASUREMENT_TYPES.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                found_types.append(meas_type)
                break  # Only add once per type
    
    return found_types

def extract_equipment_refs(text: str) -> List[str]:
    """Extract equipment model numbers and types."""
    refs = []
    for pattern in EQUIPMENT_PATTERNS:
        matches = re.findall(pattern, text, flags=re.IGNORECASE)
        refs.extend(matches)
    return list(set(refs))

def extract_temporal_info(text: str) -> List[str]:
    """Extract timing and sequencing information."""
    temporal = []
    
    # Duration patterns
    duration_pattern = r"\b\d+\s*(?:ms|millisecond|second|minute|hour|s|min|h)\b"
    temporal.extend(re.findall(duration_pattern, text, flags=re.IGNORECASE))
    
    # Sequence patterns
    sequence_words = ["first", "then", "after", "before", "finally", "next", "last"]
    for word in sequence_words:
        if re.search(rf"\b{word}\b", text, flags=re.IGNORECASE):
            temporal.append(word)
    
    # Rate patterns
    rate_pattern = r"\bevery\s+\d+\s*(?:ms|s|second|minute)\b"
    temporal.extend(re.findall(rate_pattern, text, flags=re.IGNORECASE))
    
    return temporal

def extract_action_verbs(doc) -> List[str]:
    """Extract action verbs from spaCy doc to understand user's desired actions."""
    action_verbs = []
    for token in doc:
        if token.pos_ == "VERB" and not token.is_stop:
            action_verbs.append(token.lemma_)
    return action_verbs

def _dedup_targets(targets: List[str]) -> List[str]:
    """Drop targets that are substrings of longer targets to remove redundancy."""
    unique = []
    for t in targets:
        if not any(t != o and t in o for o in targets):
            unique.append(t)
    return unique

# ============================================================================
# MAIN PREPROCESSING FUNCTION
# ============================================================================

def preprocess_input(text: str) -> ParsedInput:
    """
    Enhanced preprocessing with intent detection and structured output.
    
    Args:
        text: Raw user input
        
    Returns:
        ParsedInput object with all extracted information
    """
    original = text.strip()
    
    # 1) Extract SCPI commands first
    scpi_cmds = extract_scpi_commands_from_text(original)
    
    # 2) Classify intent
    intent, confidence = classify_intent(original, bool(scpi_cmds))
    
    # 3) Remove SCPI commands from text before further NLP
    text_wo_scpi = original
    for cmd in scpi_cmds:
        text_wo_scpi = re.sub(re.escape(cmd), " ", text_wo_scpi, flags=re.IGNORECASE)
    
    # 4) Extract structured information
    conditions = extract_conditions(text_wo_scpi)
    targets = _dedup_targets(extract_target_context(text_wo_scpi))
    measurement_types = extract_measurement_types(text_wo_scpi)
    equipment_refs = extract_equipment_refs(text_wo_scpi)
    temporal_info = extract_temporal_info(text_wo_scpi)
    
    # 5) SpaCy processing for lemmatization and verb extraction
    doc = nlp(text_wo_scpi.lower())
    action_verbs = extract_action_verbs(doc)
    
    # 6) Lemmatize remaining words
    tokens = [tok.lemma_ for tok in doc
              if not (tok.is_punct or tok.is_space)]
    lemmatized = " ".join(tokens)
    
    logger.debug(f"Preprocessed - Intent: {intent.value}, Confidence: {confidence:.2f}")
    logger.debug(f"SCPI Commands: {scpi_cmds}")
    logger.debug(f"Measurement Types: {measurement_types}")
    
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
        temporal_info=temporal_info
    )

def format_for_llm(parsed: ParsedInput) -> str:
    """
    Format parsed input into a structured prompt for the LLM.
    
    Args:
        parsed: ParsedInput object
        
    Returns:
        Formatted string ready for LLM consumption
    """
    prompt_parts = [f"User Request: {parsed.original_text}"]
    
    if parsed.intent != Intent.UNKNOWN:
        prompt_parts.append(f"\nDetected Intent: {parsed.intent.value} (confidence: {parsed.confidence:.2f})")
    
    if parsed.scpi_commands:
        prompt_parts.append(f"\nSCPI Commands Found: {', '.join(parsed.scpi_commands)}")
    
    if parsed.measurement_types:
        prompt_parts.append(f"\nMeasurement Types: {', '.join(parsed.measurement_types)}")
    
    if parsed.conditions:
        prompt_parts.append(f"\nConditions: {', '.join(parsed.conditions)}")
    
    if parsed.targets:
        prompt_parts.append(f"\nTargets: {', '.join(parsed.targets)}")
    
    if parsed.equipment_refs:
        prompt_parts.append(f"\nEquipment: {', '.join(parsed.equipment_refs)}")
    
    if parsed.temporal_info:
        prompt_parts.append(f"\nTiming: {', '.join(parsed.temporal_info)}")
    
    if parsed.action_verbs:
        prompt_parts.append(f"\nActions: {', '.join(parsed.action_verbs)}")
    
    return "\n".join(prompt_parts)


# ============================================================================
# VALIDATION HELPERS
# ============================================================================

def validate_scpi_syntax(command: str) -> Tuple[bool, Optional[str]]:
    """
    Basic validation of SCPI command syntax.
    
    Returns:
        (is_valid, error_message)
    """
    if not command:
        return False, "Empty command"
    
    # Check if it starts correctly
    if not (command.startswith(':') or command.startswith('*')):
        return False, "SCPI command must start with ':' or '*'"
    
    # Check for balanced parentheses
    if command.count('(') != command.count(')'):
        return False, "Unbalanced parentheses"
    
    return True, None