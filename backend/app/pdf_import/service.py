from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from uuid import UUID
from .utils.suggest_intent import extract_scpi_from_pdf
from ..entities.entities import SelectedInstrument
from .utils.supabase import upload_to_supabase
import logging


logger = logging.getLogger(__name__)

def process_pdf_upload(db: Session, file: UploadFile):
    try:
        # Extract instrument name and SCPI commands
        extracted_data = extract_scpi_from_pdf(file)
        instrument_filename = extracted_data["instrument_name"]
        scpi_commands = extracted_data["scpi_commands"]

        # Check if the instrument already exists in the database
        existing_entry = db.query(SelectedInstrument).filter_by(instrument_filename=instrument_filename).first()
        if existing_entry:
            logger.info(f"Instrument '{instrument_filename}' already exists. Returning existing JSON URL.")
            return {"instrument_name": instrument_filename, "json_url_manual": existing_entry.json_url_manual}

        # Upload JSON data to Supabase
        bucket_name = "scpi-json"

        json_file_name = f"{instrument_filename}.json"
        json_url_manual = upload_to_supabase(bucket_name, scpi_commands, json_file_name)

        # Save metadata to the database
        detected_instrument = SelectedInstrument(
            instrument_filename=instrument_filename,
            json_url_manual=json_url_manual,
        )
        db.add(detected_instrument)
        db.commit()

        logger.info(f"SCPI commands for '{instrument_filename}' saved to Supabase and metadata saved to PostgreSQL.")
        return {"instrument_name": instrument_filename, "json_url_manual": json_url_manual}

    except Exception as e:
        db.rollback()
        logger.exception("Failed to process PDF upload")
        raise HTTPException(status_code=500, detail=f"Failed to process PDF upload: {str(e)}")
    
