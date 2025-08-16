from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from uuid import UUID
from .utils.suggest_intent import extract_scpi_from_pdf
from ..entities.entities import InstrumentMetadata
from .utils.supabase import upload_to_supabase
import logging


logger = logging.getLogger(__name__)

def process_pdf_upload(db: Session, file: UploadFile):
    try:
        # Extract instrument name and SCPI commands
        extracted_data = extract_scpi_from_pdf(file)
        instrument_name = extracted_data["instrument_name"]
        scpi_commands = extracted_data["scpi_commands"]

        # Check if the instrument already exists in the database
        existing_entry = db.query(InstrumentMetadata).filter_by(instrument_name=instrument_name).first()
        if existing_entry:
            logger.info(f"Instrument '{instrument_name}' already exists. Returning existing JSON URL.")
            return {"instrument_name": instrument_name, "json_url": existing_entry.json_url}

        # Upload JSON data to Supabase
        bucket_name = "scpi-json"

        json_file_name = f"{instrument_name}.json"
        json_url = upload_to_supabase(bucket_name, scpi_commands, json_file_name)

        # Save metadata to the database
        new_metadata = InstrumentMetadata(
            instrument_name=instrument_name,
            json_url=json_url,
        )
        db.add(new_metadata)
        db.commit()

        logger.info(f"SCPI commands for '{instrument_name}' saved to Supabase and metadata saved to PostgreSQL.")
        return {"instrument_name": instrument_name, "json_url": json_url}

    except Exception as e:
        db.rollback()
        logger.exception("Failed to process PDF upload")
        raise HTTPException(status_code=500, detail=f"Failed to process PDF upload: {str(e)}")
    
