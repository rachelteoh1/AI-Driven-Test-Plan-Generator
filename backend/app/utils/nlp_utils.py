import spacy
import re


nlp = spacy.load("en_core_web_lg")

# Matches SCPI commands with optional arguments
SCPI_WITH_ARGS_PATTERN = r":[A-Z]+(?::[A-Z]+)*\??(?:\s*\(.*?\))?"

def preprocess_input(text: str):
    original_text = text
    text = text.strip()
    doc = nlp(text.lower())

    # Extract full SCPI expressions with optional args
    matches = re.findall(SCPI_WITH_ARGS_PATTERN, text.upper())

    # Extract only the SCPI command part (remove args for classification)
    scpi_commands = [re.match(r":[A-Z]+(?::[A-Z]+)*\??", m).group(0) for m in matches if re.match(r":[A-Z]+(?::[A-Z]+)*\??", m)]

    # Remove SCPI parts before NLP processing
    for m in matches:
        text = text.replace(m, "")

    # Lemmatize the remaining text
    tokens = [token.lemma_ for token in nlp(text) if not token.is_punct]
    processed_text = " ".join(tokens)

    return processed_text, scpi_commands, matches  # return both plain and full SCPI expressions


def classify_intent_rule_based(text: str, scpi_commands: list):
    if "explain" in text or "what does" in text:
        return "explain_scpi"
    elif "generate" in text or "create" in text or "sequence" in text:
        return "generate_scpi"
    return "unknown"
