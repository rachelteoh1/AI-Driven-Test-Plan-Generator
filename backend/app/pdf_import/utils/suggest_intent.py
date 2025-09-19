import fitz  # PyMuPDF
import json
from concurrent.futures import ThreadPoolExecutor
from ..utils.models.query_intent import query_ollama
from ..utils.models.llama_intent import query_llama
from ..utils.models.gemini_intent import query_gemini, query_gemini_via_helicone
import re
import os

SUBSYSTEM_HEADER_REGEX = re.compile(
    r"\b[A-Z][A-Za-z]*\s+Subsystem(?:\s*\(.*?\))?", 
    re.IGNORECASE
)

EXCLUDE_KEYWORDS = [
    "table of contents",
    "contents",
    "content",
    " . . . . . . . . . . . . . . . .",
    "............",
    "summary"
]

TOC = [
    " . . . . . . . . . . . . . . . .",
    "............",
]

import re

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

import re

SCPI_TOC_REGEX = re.compile(r"""
    ^\s*                             # optional leading spaces
    ([:\*]                         # must start with :, *, or [
        (?:\[?[A-Z]{3,4}[a-z]*\]?   # first keyword: 3-4 uppercase, optional lowercase, optional brackets
            (?:                      
                :\[?[A-Z]{3,4}[a-z]*\]?   # hierarchy keywords, same pattern
                |
                \[[^\]]+\]               # optional brackets content
                |
                <[^>]+>                  # optional parameters in <>
            )*
        )
    )
    \??                               # optional query ?
    """, re.VERBOSE)

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

def extract_scpi_pages(file_bytes):
    """
    Extracts text from pages that likely contain SCPI subsystem commands.
    Only extracts pages where the first 10 words contain the word "subsystem".
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        scpi_pages = []
        
        # Extract instrument name
        first_page_text = normalize_text(doc[0].get_text()) if len(doc) > 0 else ""
        instrument_name = extract_instrument_name(first_page_text)
        print(f"Extracted instrument name: {instrument_name}")

        for page_number, page in enumerate(doc, start=1):
            text = normalize_text(page.get_text())
            if is_unwanted_page(text):
                continue

            # Check if the first 10 words contain "subsystem"
            #first_10_words = " ".join(text.split()[:10]).lower()
            #print(f"Page {page_number} - First 10 words: {first_10_words}")
            if SUBSYSTEM_HEADER_REGEX.search(text) and SCPI_REGEX.search(text):
                scpi_pages.append((page_number, text))
                # Uncomment for debugging
                print(f"Page {page_number} contains 'subsystem'")

        return instrument_name, scpi_pages
    except Exception as e:
        raise ValueError(f"Failed to extract SCPI pages from PDF: {str(e)}")

def process_scpi_text(text, page_number=None):
    """
    Extracts SCPI commands, parameters, and metadata from a PDF file using Llama.

    Args:
        file (UploadFile or file-like object): The uploaded PDF file.

    Returns:
        list: A list of parsed model responses (JSON) from each page.
    """
    page_info_str = f"{page_number}" if page_number is not None else "merged pages"
    print(f"Extracting SCPI from page {page_info_str}...")
    # ...existing prompt code...
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
        f"Now extract from this text (from page {page_number}):\n{text}\n"
    )
    response = query_gemini_via_helicone(prompt)
    print(f"Model Response for page {page_number}:\n{response}\n{'-' * 40}")
    try:
        # Strip Markdown fences if present
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(json)?", "", cleaned, flags=re.IGNORECASE).strip()
            cleaned = re.sub(r"```$", "", cleaned).strip()

        response_json = json.loads(cleaned)
        # Ignore empty {}
        if not response_json:
            return None
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

def count_scpi_commands(scpi_json):
    """
    Recursively counts every occurrence of 'command' as a key at any level in the JSON.
    """
    count = 0
    if isinstance(scpi_json, dict):
        for key, value in scpi_json.items():
            if key == "command":
                count += 1
            count += count_scpi_commands(value)
    elif isinstance(scpi_json, list):
        for item in scpi_json:
            count += count_scpi_commands(item)
    return count

def normalize_scpi_command(cmd):
    """
    Removes brackets, angle brackets, spaces, and symbols from a SCPI command and lowercases it.
    """
    cmd = re.sub(r"[\[\]<>]", "", cmd)  # Remove brackets and angle brackets
    cmd = re.sub(r"\s+", "", cmd)       # Remove all whitespace
    cmd = re.sub(r"[^\w:*\?]", "", cmd) # Remove non-word characters except :, *, ?
    return cmd.lower()
    
def extract_scpi_from_pdf(file_bytes):
    """
    Extracts SCPI commands and metadata from a PDF file by merging all relevant pages,
    sending them in a single call to the model, and calculating extraction coverage.
    """
    try:
        # Step 1: Extract instrument name and SCPI pages
        instrument_name, scpi_pages = extract_scpi_pages(file_bytes)

        # Merge all relevant page texts into one big string
        merged_text = "\n\n".join(
            f"--- Page {page_number} ---\n{text}" for page_number, text in scpi_pages
        )

        # Send the merged text to the model in one call
        result = process_scpi_text(merged_text, page_number="all")
        merged_results = merge_scpi_json([result])

        # Count the number of SCPI commands extracted
        scpi_command_count = count_scpi_commands(merged_results)
        print(f"Extracted {scpi_command_count} SCPI commands.")

        # Step 2: Extract total SCPI commands from TOC
        toc_result = extract_scpi_commands_from_toc(file_bytes)
        toc_commands = set(normalize_scpi_command(cmd) for cmd in toc_result.get("scpi_commands", []))
        total_scpi_commands = toc_result.get("total_scpi_commands", 1)  # avoid division by zero
        print(f"Total SCPI commands in TOC: {total_scpi_commands}")

        # Step 3: Collect all normalized extracted SCPI commands
        def collect_extracted_commands(scpi_json):
            commands = set()
            if isinstance(scpi_json, dict):
                for key, value in scpi_json.items():
                    if key == "command" and isinstance(value, str):
                        commands.add(normalize_scpi_command(value))
                    else:
                        commands.update(collect_extracted_commands(value))
            elif isinstance(scpi_json, list):
                for item in scpi_json:
                    commands.update(collect_extracted_commands(item))
            return commands

        extracted_commands = collect_extracted_commands(merged_results)

        # Step 4: Calculate how many extracted commands match TOC commands
        matched_commands = extracted_commands & toc_commands
        scpi_command_matched = len(matched_commands)
        print(f"Matched SCPI commands: {scpi_command_matched} / {total_scpi_commands}")

        for cmd in matched_commands:
            print(f"Matched SCPI command: {cmd}")
        
        # Step 5: Calculate coverage
        coverage = int((scpi_command_matched / total_scpi_commands) * 100) if total_scpi_commands else 0
        print(f"Coverage: {coverage}%")

        # Step 6: Return extracted data with coverage
        return {
            "instrument_name": instrument_name,
            "scpi_commands": merged_results,
            "total_scpi_commands_extracted": scpi_command_count,
            "total_scpi_commands_in_toc": total_scpi_commands,
            "scpi_command_matched": scpi_command_matched,
            "coverage": coverage
        }
    except Exception as e:
        raise ValueError(f"Failed to extract SCPI commands from PDF: {str(e)}")
    
def extract_scpi_commands_from_toc(file_bytes):
    """
    Extracts TOC pages and SCPI commands from those pages in a PDF file.
    Returns a dict with 'toc_pages' and 'scpi_commands'.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    toc_pages = []
    scpi_commands = []
    for page_number, page in enumerate(doc, start=1):
        text = page.get_text()
        lower_text = text.lower()
        # If any TOC keyword is present, consider this a TOC page
        if any(kw in lower_text for kw in TOC):
            toc_pages.append((page_number, text))
            # Extract SCPI commands from this TOC page
            for line in text.splitlines():
                line_no_brackets = line.replace('[', '').replace(']', '')
                parts = re.split(r"\s*\.+\s*", line_no_brackets, maxsplit=1)
                if parts:
                    cmd = parts[0].strip()
                    if SCPI_TOC_REGEX.match(cmd):
                        scpi_commands.append(cmd)
    return {
        "scpi_commands": scpi_commands,
        "total_scpi_commands": len(scpi_commands)
    }