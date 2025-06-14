import spacy
import re


nlp = spacy.load("en_core_web_lg")

# Matches SCPI commands with optional arguments
SCPI_WITH_ARGS_PATTERN = r":[A-Z]+(?::[A-Z]+)*\??(?:\s*\(.*?\))?"

def extract_conditions(text: str):
    # Valid units: V, A, Ω, etc.
    units = r"(?:V|A|Ω|ohm|Hz|kHz|mA|μA|%)"  # <-- non-capturing group
    pattern = fr"\b[-+]?\d*\.?\d+\s?{units}\b"
    return re.findall(pattern, text, flags=re.IGNORECASE)

def extract_target_context(text: str):
    targets = set()

    # Match "channel 3"
    channels = re.findall(r"\bchannel\s+\d+\b", text, flags=re.IGNORECASE)
    targets.update(channels)

    # Match "for capacitor", "for diode"
    fors = re.findall(r"\bfor\s+\w+\b", text, flags=re.IGNORECASE)
    targets.update(fors)

    # Match "on channel 3", "on input"
    ons = re.findall(r"\bon\s+(?:channel\s+\d+|\w+(?:\s+\w+)?)", text, flags=re.IGNORECASE)
    targets.update(ons)

    # Remove nested/duplicate targets
    unique_targets = list(targets)
    return sorted(unique_targets)

def clean_duplicate_targets(targets):
    final = []
    for t in targets:
        if not any(t != other and t in other for other in targets):
            final.append(t)
    return final

def preprocess_input(text: str):
    original_text = text.strip()
    doc = nlp(original_text.lower())

    # Extract SCPI commands
    matches = re.findall(SCPI_WITH_ARGS_PATTERN, original_text.upper())
    scpi_commands = [
        re.match(r":[A-Z]+(?::[A-Z]+)*\??", m).group(0)
        for m in matches if re.match(r":[A-Z]+(?::[A-Z]+)*\??", m)
    ]

    # Extract conditions and target/context
    conditions = extract_conditions(original_text)
    targets = extract_target_context(original_text)
    clean_targets = clean_duplicate_targets(targets)

    # Remove SCPI commands before NLP processing
    for m in matches:
        original_text = original_text.replace(m, "")

    # NLP-based lemmatization
    tokens = [token.lemma_ for token in nlp(original_text) if not token.is_punct]
    processed_text = " ".join(tokens)

    return processed_text, scpi_commands, matches, conditions, clean_targets



