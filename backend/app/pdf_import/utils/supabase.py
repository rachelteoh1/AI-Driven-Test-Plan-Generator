import json
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def upload_to_supabase(bucket_name: str, json_data: list, file_name: str) -> str:
    """
    Uploads JSON data to Supabase Storage and returns the public URL.

    Args:
        bucket_name (str): The name of the Supabase Storage bucket.
        json_data (list): The JSON data to upload.
        file_name (str): The name of the file in the bucket.

    Returns:
        str: The public URL of the uploaded file.
    """
    try:
        # Check if the file already exists in the bucket
        existing_files = supabase.storage.from_(bucket_name).list()
        if any(file["name"] == file_name for file in existing_files):
            # If the file exists, construct and return the public URL
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{file_name}"
            return public_url

        # Convert JSON data to a string
        json_string = json.dumps(json_data, indent=4)

        # Upload the JSON string to Supabase
        response = supabase.storage.from_(bucket_name).upload(
            file_name,
            json_string.encode("utf-8"),
        {"content-type": "application/json"}
        )

        # If upload is successful, construct the public URL
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{file_name}"
        return public_url
    except Exception as e:
        raise Exception(f"Error uploading JSON to Supabase: {str(e)}")

