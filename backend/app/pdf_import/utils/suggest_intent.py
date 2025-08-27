import fitz  # PyMuPDF
import json
from concurrent.futures import ThreadPoolExecutor
from ..utils.models.query_intent import query_ollama
from ..utils.models.llama_intent import query_llama
from ..utils.models.gemini_intent import query_gemini
import re
import os

SUBSYSTEM_HEADER_REGEX = re.compile(
    r"\b[A-Z][A-Za-z]*\s+Subsystem(?:\s*\(.*?\))?", 
    re.IGNORECASE
)

EXCLUDE_KEYWORDS = [
    "table of contents",
    "contents",
    "content"
]

SCPI_REGEX = re.compile(
    r"""
    (?<!\S)                                      # token boundary
    (?:                                          # ── 3 forms ───────────────────
        \*[A-Z]+                                 #  *IDN, *RST  …
      |                                          #  OR
        :[A-Z]+(?:\s*:\s*[A-Z]+)*(?:\?)?         #  :SYST:COMM:LAN:GAT or :SYST:COMM:LAN:GAT?
      |                                          #  OR
        [A-Z]+(?:\s*:\s*[A-Z]+)*(?:\?)?          #  ROUT:SCAN or ROUT:SCAN?
    )
    (?:                                          # optional argument section
        \s+[^\[\]()\s]+                          #   space + simple argument (e.g., address)
      | \s*\([^)]*\)                             #   ( 1,2,3 )
      | \s*\[\s*[^\[\]]+\s*\]                    #   [CURR|STAT]
      | \s*@\([^)]*\)                            #   @ (101:110)
    )?
    (?=\s|$)                                     # token boundary
    """,
    re.VERBOSE | re.IGNORECASE,
)

def is_unwanted_page(text):
    """Check if page is likely a TOC or unrelated."""
    lower_text = text.lower()
    return any(kw in lower_text for kw in EXCLUDE_KEYWORDS)

def normalize_text(text):
    """
    Cleans up and normalizes extracted text by removing excessive line breaks
    and joining broken lines.
    """
    # Replace multiple newlines with a single space
    text = re.sub(r"\n+", " ", text)
    # Remove extra spaces
    text = re.sub(r"\s{2,}", " ", text)
    # Join lines that are broken mid-sentence or mid-command
    text = re.sub(r"(\S)\s*\n\s*(\S)", r"\1 \2", text)  # Join lines without punctuation
    return text.strip()

def extract_instrument_name(text):
    instrument_regex = re.compile(
        r"\b[A-Z]{1,3}\d{3,4}[A-Z]?(?:[/&]\d{2,4}[A-Z]?)*\b"
    )

    matches = instrument_regex.finditer(text)
    seen = set()
    instruments = []

    for match in matches:
        part = match.group(0)
        pieces = re.split(r"[/&]", part)

        # Extract base model (letters + digits + optional suffix)
        base_full = pieces[0]
        base_letters = re.match(r"[A-Z]+", base_full).group(0)
        base_digits = re.search(r"\d+", base_full).group(0)

        for p in pieces:
            p = p.strip()
            if not p:
                continue
            if re.match(r"^\d", p):
                # If starts with digit, inherit letters and possibly part of digits
                # Example: base E8257D + "67D" => E8267D
                # Rule: take base letters + first 2 digits of base + this piece
                inst = base_letters + base_digits[:2] + p
            else:
                inst = p

            if inst not in seen:
                seen.add(inst)
                instruments.append(inst)

    return "_".join(instruments) if instruments else "unknown_instrument"

def extract_scpi_pages(file):
    """
    Extracts text from pages that likely contain SCPI subsystem commands.
    Only extracts pages where the first 10 words contain the word "subsystem".
    """
    try:
        doc = fitz.open(stream=file.file.read(), filetype="pdf")
        scpi_pages = []
        
        # Extract instrument name
        first_page_text = normalize_text(doc[0].get_text()) if len(doc) > 0 else ""
        instrument_name = extract_instrument_name(first_page_text)
        print(f"Extracted instrument name: {instrument_name}")

        for page_number, page in enumerate(doc, start=1):
            text = normalize_text(page.get_text())
            if is_unwanted_page(text):
                continue

            # # Check if the first 10 words contain "subsystem"
            # first_10_words = " ".join(text.split()[:10]).lower()
            # print(f"Page {page_number} - First 10 words: {first_10_words}")
            if SUBSYSTEM_HEADER_REGEX.search(text) and SCPI_REGEX.search(text):
                scpi_pages.append(text)
                # Uncomment for debugging
                print(f"Page {page_number} contains 'subsystem'")

        return instrument_name, scpi_pages
    except Exception as e:
        raise ValueError(f"Failed to extract SCPI pages from PDF: {str(e)}")

def process_scpi_text(text):
    """
    Extracts SCPI commands, parameters, and metadata from a PDF file using Llama.

    Args:
        file (UploadFile or file-like object): The uploaded PDF file.

    Returns:
        list: A list of parsed model responses (JSON) from each page.
    """
    prompt = (
        "You are a SCPI command parser.\n\n"
        "Extract SCPI command documentation into the following *structured JSON* format:\n\n"
        "{\n"
        "  \"<intent>\": {\n"
        "    \"<subsystem>\": {\n"
        "      \"command\": \"<full SCPI command>\",\n"
        "      \"parameters\": [\"<parameter1>\", \"<parameter2>\", ...],\n"
        "      \"values\": {\n"
        "        \"<parameter1>\": [\"<value1>\", \"<value2>\", ...],\n"
        "        ...\n"
        "      },\n"
        "      \"description\": \"<one-line explanation>\"\n"
        "    }\n"
        "  }\n"
        "}\n\n"
        "SCPI command format:\n"
        "- SCPI commands use colons : for hierarchy, e.g., :MEASure:CURRent:DC?\n"
        "- The first keyword indicates the *intent* (e.g., MEASure, SOURce, CONFigure)\n"
        "- The second part(s) are the *subsystem*\n"
        "- Parameters are usually inside syntax blocks like <channel>, <range>, <nplc> or described in nearby lines or tables\n"
        "- Parameter values are examples listed below or near each parameter\n"
        "- Description is usually in the sentence above or below the command\n"
        "- if the SCPI command doesn't have parameters, values and description, skip that page\n"
        "---\n\n"
        "Example input block:\n"
        ":SOURce:VOLTage:LEVel:IMMediate:AMPLitude\n"
        "Sets the output voltage level of the specified channel.\n"
        "Syntax:\n"
        ":SOURce:VOLTage:LEVel:IMMediate:AMPLitude <channel>,<level>,<unit>\n"
        "<channel>: CH1 or CH2\n"
        "<level>: voltage value in volts\n"
        "<unit>: V or mV\n"
        "---\n\n"
        "Return:\n"
        "{\n"
        "  \"source\": {\n"
        "    \"voltage\": {\n"
        "      \"command\": \":SOURce:VOLTage:LEVel:IMMediate:AMPLitude\",\n"
        "      \"parameters\": [\"channel\", \"level\", \"unit\"],\n"
        "      \"values\": {\n"
        "        \"channel\": [\"CH1\", \"CH2\"],\n"
        "        \"unit\": [\"V\", \"mV\"]\n"
        "      },\n"
        "      \"description\": \"Sets the output voltage level of the specified channel.\"\n"
        "    }\n"
        "  }\n"
        "}\n\n"
        "Only extract commands that show a SCPI command line starting with ':' or '*'."
        "Do not include generic subsystem headers (e.g., 'FETCh Subsystem', 'FORMat Subsystem') unless they also include at least one explicit SCPI command."
        f"Now extract from this text:\n{text}\n"
        "Return only valid JSON without code block markers."
    )
    response = query_gemini(prompt)
    print(f"Model Response:\n{response}\n{'-' * 40}")
    try:
        response_json = json.loads(response)
        return response_json
    except json.JSONDecodeError as e:
        print(f"JSON Parsing Error: {e}")
        return None
    
def merge_scpi_json(json_list):
    merged = {}

    for item in json_list:
        if not isinstance(item, dict):
            continue  # skip nulls or non-dicts
        for intent, subsystems in item.items():
            if intent not in merged:
                merged[intent] = {}
            for subsystem, details in subsystems.items():
                merged[intent][subsystem] = details

    return merged

def extract_scpi_from_pdf(file):
    """
    Extracts SCPI commands and metadata from a PDF file.
    """
    try:
        # Step 1: Extract instrument name and SCPI pages
        instrument_name, scpi_pages = extract_scpi_pages(file)

        # Step 2: Process SCPI pages
        with ThreadPoolExecutor() as executor:
            results = list(executor.map(process_scpi_text, scpi_pages))
            
        merged_results = merge_scpi_json(results)

        # Step 3: Return extracted data
        return {
            "instrument_name": instrument_name,
            "scpi_commands": merged_results,
        }
    except Exception as e:
        raise ValueError(f"Failed to extract SCPI commands from PDF: {str(e)}")