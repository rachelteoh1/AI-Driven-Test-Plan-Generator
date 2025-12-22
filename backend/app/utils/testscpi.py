import re
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# IMPROVED SCPI REGEX - Better argument handling
# ============================================================================

SCPI_KEYWORDS = {
    'MEAS', 'CONF', 'READ', 'INIT', 'FETC', 'CALC', 'TRIG', 'SAMP', 'FORM',
    'SOUR', 'SENS', 'OUTP', 'DISP', 'SYST', 'STAT', 'ROUT', 'SCAN', 'CLOS',
    'OPEN', 'VOLT', 'CURR', 'RES', 'FREQ', 'PER', 'TEMP', 'CONT', 'FRES',
    'DATA', 'APER', 'NPLC', 'RANG', 'AUTO', 'AVER', 'COUN', 'TCON', 'DEL'
}

# Words that look like SCPI but are actually English context
ENGLISH_FALSE_POSITIVES = {
    'CHANNEL', 'OUTPUT', 'INPUT', 'VOLTAGE', 'CURRENT', 'MEASURE', 'CONFIGURE',
    'ENABLE', 'DISABLE', 'USING', 'BEFORE', 'AFTER', 'THEN'
}

# Improved SCPI regex with better argument handling
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
            if not cmd.startswith((':', '*')):
                cmd = ':' + cmd
            
            if cmd not in seen:
                commands.append(cmd)
                seen.add(cmd)
                logger.debug(f"Extracted SCPI: {cmd}")
                # print(f"  [DEBUG] Accepted: '{cmd}'")
        # else:
            # print("  [DEBUG] Rejected by validation")
    
    return commands


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    # First, let's do a manual regex test on the failing cases
    print("=" * 80)
    print("MANUAL REGEX DEBUGGING")
    print("=" * 80)
    
    failing_tests = [
        "Configure CONF:VOLT:DC 10,0.001 and read",
        "CONF:VOLT:DC then MEAS:VOLT? and log to file",
    ]
    
    for test_str in failing_tests:
        print(f"\nInput: {test_str}")
        print("Regex matches:")
        for match in SCPI_REGEX.finditer(test_str):
            print(f"  - Position {match.start()}-{match.end()}: '{match.group(0)}'")
        print()
    
    print("=" * 80)
    print()
    
    test_cases = [
        # Original test cases - CHANNEL should NOT be extracted (it's English context)
        ("Enable output OUTP ON, set voltage to 12 V on channel 6 for fan test.", 
         [':OUTP ON']),
        
        ("Measure voltage using MEAS:VOLT? on channel 101", 
         [':MEAS:VOLT?']),
        
        # CONF:VOLT:DC needs to be captured even before "and"
        ("Configure CONF:VOLT:DC 10,0.001 and read", 
         [':CONF:VOLT:DC 10,0.001', ':READ']),
        
        ("Set SOUR:VOLT 5.0 then enable OUTP ON", 
         [':SOUR:VOLT 5.0', ':OUTP ON']),
        
        ("Enable output :OUTP ON, set voltage to 12 V", 
         [':OUTP ON']),
        
        ("Use :MEAS:VOLT? to measure", 
         [':MEAS:VOLT?']),
        
        # Common commands
        ("Send *RST and *CLS before testing", 
         ['*RST', '*CLS']),
        
        ("Query *IDN? to identify device", 
         ['*IDN?']),
        
        # Mixed - CONF:VOLT:DC without args should still be captured
        ("CONF:VOLT:DC then MEAS:VOLT? and log to file", 
         [':CONF:VOLT:DC', ':MEAS:VOLT?']),
        
        ("Set voltage SOUR:VOLT 3.3, read current MEAS:CURR?", 
         [':SOUR:VOLT 3.3', ':MEAS:CURR?']),
        
        # Additional edge cases
        ("CONF:RES 1000,0.01 and TRIG:SOUR IMM", 
         [':CONF:RES 1000,0.01', ':TRIG:SOUR IMM']),
        
        ("Set SOUR:CURR:LEV 0.5,0.1 then measure", 
         [':SOUR:CURR:LEV 0.5,0.1']),
        
        ("ROUT:SCAN @(101:110) and INIT", 
         [':ROUT:SCAN @(101:110)', ':INIT']),
        
        ("Configure frequency CONF:FREQ 1e6,1e3", 
         [':CONF:FREQ 1E6,1E3']),
    ]
    
    print("SCPI Command Extraction Tests")
    print("=" * 80)
    
    passed = 0
    failed = 0
    
    for i, (test_input, expected) in enumerate(test_cases, 1):
        result = extract_scpi_commands_from_text(test_input)
        
        # Normalize for comparison
        result_normalized = sorted(result)
        expected_normalized = sorted(expected)
        
        status = "✓ PASS" if result_normalized == expected_normalized else "✗ FAIL"
        if result_normalized == expected_normalized:
            passed += 1
        else:
            failed += 1
        
        print(f"\nTest {i}: {status}")
        print(f"Input:    {test_input}")
        print(f"Expected: {expected_normalized}")
        print(f"Got:      {result_normalized}")
        
        if result_normalized != expected_normalized:
            missing = set(expected_normalized) - set(result_normalized)
            extra = set(result_normalized) - set(expected_normalized)
            if missing:
                print(f"Missing:  {list(missing)}")
            if extra:
                print(f"Extra:    {list(extra)}")
    
    print(f"\n{'=' * 80}")
    print(f"Results: {passed} passed, {failed} failed out of {len(test_cases)} tests")
    print(f"Success rate: {passed/len(test_cases)*100:.1f}%")

