# nlp_utils.py  – SCPI/intent pre‑processing  (Option A: keep arguments intact)

import re
import spacy
import logging

logger = logging.getLogger(__name__)

nlp = spacy.load("en_core_web_lg")        # load once at module import



SCPI_REGEX = re.compile(
    r"""
    (?<!\S)                                      # token boundary
    (?:                                          # ── 3 forms ───────────────────
        \*[A-Z]+                                 #  *IDN, *RST  …
      |                                          #  OR
        :[A-Z]+(?:\*?[A-Z]+)*(?::[A-Z]+(?:\*?[A-Z]+)*)*  #  :MEAS:VOLT …
      |                                          #  OR
        [A-Z]+(?:\*?[A-Z]+)*(?::[A-Z]+(?:\*?[A-Z]+)*)+   #  ROUT:SCAN …
    )
    \??                                          # optional query mark
    (?:                                          # optional argument section
        \s+[^()\s]+                              #   space + simple arg  (10V)
      | \s*\([^)]*\)                             #   ( 1,2,3 )
      | \s*@\([^)]*\)                            #   @ (101:110)
    )?
    (?=\s|$)                                     # token boundary
    """,
    re.VERBOSE | re.IGNORECASE,
)


def _norm(cmd: str) -> str:
    """Return command in canonical upper‑case form, always starting with ':' or '*'."""
    cmd = cmd.upper().strip()
    return cmd if cmd.startswith((':', '*')) else ':' + cmd


def extract_scpi_commands_from_text(text: str) -> list[str]:
    """Return a list of unique SCPI commands found in *text*, with arguments preserved."""
    commands = {_norm(m.group(0)) for m in SCPI_REGEX.finditer(text)}
    logger.debug(f"Extracted SCPI commands: {commands}")
    return list(commands)



def extract_conditions(text: str) -> list[str]:
    units = r"(?:[kMmunp]?V|[kMmunp]?A|°?C|°?F|Ω|OHM|HZ|KHZ|MA|UA|%)"
    pattern = fr"\b[-+]?\d*\.?\d+\s?{units}\b"
    return re.findall(pattern, text, flags=re.IGNORECASE)


def extract_target_context(text: str) -> list[str]:
    targets: set[str] = set()
    targets.update(re.findall(r"\bchannel\s+\d+\b", text, flags=re.IGNORECASE))
    targets.update(re.findall(r"\bfor\s+\w+\b", text, flags=re.IGNORECASE))
    targets.update(re.findall(r"\bon\s+(?:channel\s+\d+|\w+(?:\s+\w+)?)",
                              text, flags=re.IGNORECASE))
    return sorted(targets)


def _dedup_targets(targets: list[str]) -> list[str]:
    """Drop targets that are substrings of longer targets to remove redundancy."""
    unique = []
    for t in targets:
        if not any(t != o and t in o for o in targets):
            unique.append(t)
    return unique


def preprocess_input(text: str):
    """
    Returns:
        lemmatized_text : str
        scpi_commands   : list[str]
        conditions      : list[str]
        targets         : list[str]
    """
    original = text.strip()

    # 1) SCPI
    scpi_cmds = extract_scpi_commands_from_text(original)

    # 2) Remove those commands from the text before further NLP
    text_wo_scpi = original
    for cmd in scpi_cmds:
        text_wo_scpi = re.sub(re.escape(cmd), " ", text_wo_scpi, flags=re.IGNORECASE)

    # 3) Other NLP entities
    conditions = extract_conditions(text_wo_scpi)
    targets    = _dedup_targets(extract_target_context(text_wo_scpi))

    # 4) Lemmatise remaining words
    tokens = [tok.lemma_ for tok in nlp(text_wo_scpi.lower())
              if not (tok.is_punct or tok.is_space)]
    lemmatised = " ".join(tokens)

    logger.debug(f"Lemmatized text: {lemmatised}")
    return lemmatised, scpi_cmds, conditions, targets
