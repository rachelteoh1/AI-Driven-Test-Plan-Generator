import fitz  # PyMuPDF
import json
from concurrent.futures import ThreadPoolExecutor
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
    (?:[:*])?[A-Z]{3,}[A-Za-z0-9]*
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

def extract_instrument_name(file_bytes):
    instrument_regex = re.compile(
        r"\b(?:[A-Z]{1,3}\d{3,4}[A-Z]?|\d{4,5}[A-Z]?)(?:[/&]\d{2,4}[A-Z]?)*\b"
    )

    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        if len(doc) == 0:
            return "unknown_instrument"

        # Get first page text
        first_page_text = doc[0].get_text()

        matches = instrument_regex.finditer(first_page_text)
        seen = set()
        instruments = []

        for match in matches:
            part = match.group(0)
            pieces = re.split(r"[/&]", part)

            # Base model (letters+digits+optional suffix)
            base_full = pieces[0]
            letters_match = re.match(r"[A-Z]+", base_full)
            digits_match = re.search(r"\d+", base_full)

            if letters_match and digits_match:
                # Example: E8257D
                base_letters = letters_match.group(0)
                base_digits = digits_match.group(0)
            elif digits_match:
                # Example: 34450A
                base_letters = ""
                base_digits = digits_match.group(0)
            else:
                base_letters = ""
                base_digits = ""

            for p in pieces:
                p = p.strip()
                if not p:
                    continue
                if re.match(r"^\d", p):
                    # If starts with digit, inherit letters+digits
                    if base_letters:
                        inst = base_letters + base_digits[:2] + p
                    else:
                        inst = p
                else:
                    inst = p

                if inst not in seen:
                    seen.add(inst)
                    instruments.append(inst)

        return "_".join(instruments) if instruments else "unknown_instrument"

    except Exception as e:
        raise ValueError(f"Failed to extract instrument name: {str(e)}")

def process_scpi_text(text, instrument_name, page_number=None):
    page_info_str = f"{page_number}" if page_number is not None else "merged pages"
    print(f"Extracting SCPI from page {page_info_str}...")
    # ...existing prompt code...
    prompt = (
        "You are a SCPI command parser.\n\n"
        "Extract SCPI command documentation into the following *structured JSON* format:\n\n"
        "Requirements:\n"
        "- Each SCPI command must be a single JSON object.\n"
        "- Include the following fields:\n"
        "  * command: full SCPI command string (without example values in braces)\n"
        "  * parameters: list of parameter names (if any)\n"
        "  * values: dictionary mapping each parameter to a list of possible values\n"
        "  * description: one-line explanation\n"
        "  * subsystem: top-level subsystem\n"
        "  * feature: second-level subsystem or feature\n"
        f"  * instrument: {instrument_name}\n"
        "  * page: the actual page number where the command is found (extract from '--- Page X ---' markers)\n"
        "\n"
        "**IMPORTANT**: The text contains page markers in the format '--- Page X ---'. \n"
        "Extract the page number from the nearest preceding marker for each SCPI command.\n"
        "Do NOT use the same page number for all commands.\n"
        "\n"
        "SCPI command format:\n"
        "- SCPI commands use colons : for hierarchy, e.g., :MEASure:CURRent:DC?\n"
        "- The first keyword indicates the *intent* (e.g., MEASure, SOURce, CONFigure)\n"
        "- The second part(s) are the *subsystem*\n"
        "- Parameters are inside syntax blocks like <channel>, <range>, <nplc> or described in nearby lines or tables\n"
        "- Parameter values are examples listed below or near each parameter with | as separator.\n"
        "- Description is usually in the sentence above or below the command\n"
        "- **if the SCPI command doesn't have parameters, values and description, skip that page**\n"
        "---\n\n"
        "Example input text:\n"
        "--- Page 42 ---\n"
        ":SOURce:VOLTage:LEVel:IMMediate:AMPLitude\n"
        "Sets the output voltage level of the specified channel.\n"
        "Syntax:\n"
        ":SOURce:VOLTage:LEVel:IMMediate:AMPLitude <channel>,<level>,<unit>\n"
        "<channel>: CH1 or CH2\n"
        "<level>: voltage value in volts\n"
        "<unit>: V or mV\n"
        "\n"
        "Example flattened JSON output:\n"
        "[\n"
        "  {\n"
        "    \"command\": \":SOURce:VOLTage:LEVel:IMMediate:AMPLitude\",\n"
        "    \"parameters\": [\"channel\", \"level\", \"unit\"],\n"
        "    \"values\": {\n"
        "      \"channel\": [\"CH1\", \"CH2\"],\n"
        "      \"level\": [],\n"
        "      \"unit\": [\"V\", \"mV\"]\n"
        "    },\n"
        "    \"description\": \"Sets the output voltage level of the specified channel.\",\n"
        "    \"subsystem\": \"source\",\n"
        "    \"feature\": \"voltage\",\n"
        f"    \"instrument\": \"{instrument_name}\",\n"
        "    \"page\": 42\n"
        "  }\n"
        "]\n\n"
        "Only extract commands that show a SCPI command line starting with ':' or '*'."
        "Do not include generic subsystem headers (e.g., 'FETCh Subsystem', 'FORMat Subsystem') unless they also include at least one explicit SCPI command."
        "Only extract from pages that consist of the description of SCPI commands and their parameters."
        "Dont extract duplicated SCPI Commands.\n"
        "Remember to extract the correct page number from the '--- Page X ---' markers for each command.\n"
        f"\nNow extract from this text:\n{text}\n"
    )
    response = query_gemini(prompt)
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
    merged = []
    seen_commands = set()

    for page_json in json_list:
        if not page_json:
            continue
        for cmd_obj in page_json:
            cmd = cmd_obj.get("command")
            if cmd and cmd not in seen_commands:
                seen_commands.add(cmd)
                merged.append(cmd_obj)

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
    cmd = re.sub(r"[\[\]<>]", "", cmd)  # Remove brackets and angle brackets
    cmd = re.sub(r"\s+", "", cmd)       # Remove all whitespace
    cmd = re.sub(r"[^\w:*\?]", "", cmd) # Remove non-word characters except :, *, ?
    return cmd.lower()
    
def extract_scpi_from_pdf(file_bytes, max_pages=None):
    try:
        # Step 1: Extract instrument name
        instrument_name = extract_instrument_name(file_bytes)

        # Step 2: Merge all page texts
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        merged_texts = []
        for page_number, page in enumerate(doc, start=1):
            if max_pages and page_number > max_pages:
                break
            text = normalize_text(page.get_text())
            if not text.strip():
                continue
            merged_texts.append(f"--- Page {page_number} ---\n{text}")

        merged_text = "\n\n".join(merged_texts)

        # Send the merged text to the model in one call
        result = process_scpi_text(merged_text, instrument_name, page_number="all")
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

        # Step 4: Calculate precision, recall, F1 and TP/FP/FN
        matched_commands = extracted_commands & toc_commands
        scpi_command_matched = len(matched_commands)
        total_predicted = len(extracted_commands)
        total_ground_truth = len(toc_commands)

        # Identify FP and FN
        false_positives = extracted_commands - toc_commands  # predicted but not in TOC
        false_negatives = toc_commands - extracted_commands  # in TOC but not predicted

        precision = scpi_command_matched / total_predicted if total_predicted > 0 else 0
        recall = scpi_command_matched / total_ground_truth if total_ground_truth > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

        print(f"Matched SCPI commands (TP): {scpi_command_matched} / {total_ground_truth}")
        print(f"Precision: {precision:.3f}")
        print(f"Recall: {recall:.3f}")
        print(f"F1 Score: {f1:.3f}")
        print("\n--- True Positives (Matched) ---")
        for cmd in matched_commands:
            print(cmd)
        print("\n--- False Positives (Extra Predictions) ---")
        for cmd in false_positives:
            print(cmd)
        print("\n--- False Negatives (Missed from TOC) ---")
        for cmd in false_negatives:
            print(cmd)

        # Step 5: Calculate coverage
        coverage = int((scpi_command_matched / total_ground_truth) * 100) if total_ground_truth else 0
        print(f"Coverage: {coverage}%")

        # Step 6: Return extracted data with metrics
        return {
            "instrument_name": instrument_name,
            "scpi_commands": merged_results,
            "total_scpi_commands_extracted": total_predicted,
            "total_scpi_commands_in_toc": total_ground_truth,
            "scpi_command_matched": scpi_command_matched,
            "coverage": coverage,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "true_positives": len(matched_commands),
            "false_positives": len(false_positives),
            "false_negatives": len(false_negatives)
        }
    except Exception as e:
        raise ValueError(f"Failed to extract SCPI commands from PDF: {str(e)}")
    
def is_toc_line(line: str) -> bool:
    # Trim whitespace
    line = line.strip()
    # Match: some text + spaces/dots + page number at end
    return bool(re.match(r"^.+\s+(\d+)$", line))

def extract_scpi_commands_from_toc(file_bytes):
    """
    Extracts TOC pages and SCPI commands from those pages in a PDF file.
    A page is considered a TOC page if more than 10 lines end with a digit.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    toc_pages = []
    scpi_commands = []

    for page_number, page in enumerate(doc, start=1):
        if page_number > 30:
            break  # stop after checking max_pages
        
        text = page.get_text()
        lines = text.splitlines()

        # Count lines that end with a digit
        digit_end_count = sum(1 for line in lines if re.search(r"\d\s*$", line))

        # If more than 10 such lines exist, consider this a TOC page
        if digit_end_count > 15:
            print(f"TOC page detected: {page_number}")
            toc_pages.append((page_number, text))

            # Extract SCPI commands from this TOC page
            for line in lines:
                line_no_brackets = line.replace('[', '').replace(']', '')
                parts = re.split(r"\s*\.+\s*", line_no_brackets, maxsplit=1)
                if parts:
                    cmd = parts[0].strip()
                    if SCPI_TOC_REGEX.match(cmd):
                        # Ignore unwanted keywords
                        if any(word in cmd.upper() for word in ["SUBSYSTEM", "IEEE", "SCPI", "ASCII", "GPIB"]):
                            continue
                        scpi_commands.append(cmd)

    return {
        "scpi_commands": scpi_commands,
        "total_scpi_commands": len(scpi_commands)
    }
