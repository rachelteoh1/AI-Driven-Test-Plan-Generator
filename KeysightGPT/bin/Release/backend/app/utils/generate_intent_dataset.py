# import re
# import random
# import csv
# from PyPDF2 import PdfReader

# # Manually defined natural-language examples
# manual_examples = [
#     ("Generate test case to measure the voltage on channel 1.", "generate_scpi"),
#     ("Test case to perform a diode forward voltage check.", "generate_scpi"),
#     ("I want to measure current through the load.", "generate_scpi"),
#     ("Explain ROUT:SCAN (@101:110).", "explain_scpi"),
#     ("What is the purpose of a current sweep test?", "explain_scpi"),
#     ("How does a diode voltage check work?", "explain_scpi")
# ]

# # Extract SCPI commands from PDF
# def extract_scpi_commands_from_pdf(pdf_path):
#     reader = PdfReader(pdf_path)
#     text = ""
#     for page in reader.pages:
#         text += page.extract_text() + "\n"
    
#     scpi_pattern = r":[A-Z]+(?::[A-Z]+)*\??"
#     commands = re.findall(scpi_pattern, text)
#     unique_commands = list(set(commands))
#     return [cmd for cmd in unique_commands if len(cmd) > 5]

# # Generate SCPI-based examples from templates
# def generate_from_templates(commands, max_samples=50):
#     explain_templates = [
#         "Explain {}",
#         "Can you explain {}?",
#         "What does {} do?",
#         "How does {} work?",
#         "I want to understand {}",
#         "What is the purpose of {}?"
#     ]
#     generate_templates = [
#         "Generate a test sequence using {}",
#         "Create SCPI sequence for {}",
#         "Build a test case that includes {}",
#         "Run a measurement with {}",
#         "Make a voltage test with {}",
#         "Use {} in a test sequence"
#     ]
#     dataset = []
#     for cmd in commands[:max_samples]:
#         dataset.append((random.choice(explain_templates).format(cmd), "explain_scpi"))
#         dataset.append((random.choice(generate_templates).format(cmd), "generate_scpi"))
#     return dataset

# # Save the full dataset to CSV
# def save_to_csv(data, csv_path):
#     with open(csv_path, "w", newline='', encoding='utf-8') as f:
#         writer = csv.writer(f)
#         writer.writerow(["text", "intent"])
#         writer.writerows(data)

# if __name__ == "__main__":
#     pdf_path = "SCPI COMMAND.pdf"  # Make sure this exists in the same folder
#     output_csv = "intent_dataset.csv"

#     # Step 1: extract SCPI commands
#     scpi_commands = extract_scpi_commands_from_pdf(pdf_path)

#     # Step 2: generate SCPI examples
#     scpi_dataset = generate_from_templates(scpi_commands)

#     # Step 3: add manual examples
#     full_dataset = manual_examples + scpi_dataset

#     # Step 4: save
#     save_to_csv(full_dataset, output_csv)

#     print(f" Generated {len(full_dataset)} examples and saved to '{output_csv}'")
