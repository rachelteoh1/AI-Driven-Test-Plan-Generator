print("Script is running...")

try:
    import pyvisa
    print("pyvisa imported successfully.")
except Exception as e:
    print("Error importing pyvisa:", e)

try:
    print("Creating ResourceManager with explicit DLL path...")
    rm = pyvisa.ResourceManager()

    print("VISA lib path:", rm.visalib.library_path)
    print("Resources:", rm.list_resources())
    print("ResourceManager created.")
    print("Listing available backends...")
    backends = rm.list_backends()
    print("Available backends:", backends)
except Exception as e:
    print("Error during ResourceManager or listing backends:", e)

try:
    print("Creating ResourceManager for VISA operations...")
    rm = pyvisa.ResourceManager()
    print("ResourceManager created for VISA operations.")
    print("VISA library path:", rm.visalib.library_path)
    print("VISA library being used:", rm.visalib)
    resources = rm.list_resources()
    print("Scanning instruments...")
    print("Detected resources:", resources)
    if not resources:
        print("No VISA instruments detected.")
except Exception as e:
    print("Error during VISA operations:", e)