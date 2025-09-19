print("Script is running...")

try:
    import pyvisa
    print("pyvisa imported successfully.")
except Exception as e:
    print("Error importing pyvisa:", e)

try:
    print("Creating ResourceManager with explicit DLL path...")
    rm = pyvisa.ResourceManager(r"C:\Windows\System32\visa64.dll")
    # rm = pyvisa.ResourceManager()

    print("VISA lib path:", rm.visalib.library_path)
    print("Resources:", rm.list_resources())
    print("ResourceManager created.")
    print("Listing available backends...")
    backends = rm.list_backends()
    print("Available backends:", backends)
except Exception as e:
    print("Error during ResourceManager or listing backends:", e)