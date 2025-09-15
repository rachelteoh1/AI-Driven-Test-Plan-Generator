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
        # Extract instrument name(s) and SCPI commands from PDF
        extracted_data = extract_scpi_from_pdf(file)
        instrument_name = extracted_data["instrument_name"]
        extracted_models = [m.lower() for m in instrument_name.split("_")]
        scpi_commands = extracted_data["scpi_commands"]
        
        # Query all SelectedInstrument entries
        all_entries = db.query(SelectedInstrument).all()
        
        print("Extracted models:", extracted_models)
        print("Database models:", [entry.model for entry in all_entries])

        # Find the entry whose model matches any extracted model
        matched_entry = None
        for entry in all_entries:
            if not entry.model:
                continue
            if entry.model.lower() in extracted_models:
                matched_entry = entry
                break

        if matched_entry:
            # Upload JSON to Supabase
            bucket_name = "scpi-json"
            json_file_name = f"{instrument_name}.json"
            json_url_manual = upload_to_supabase(bucket_name, scpi_commands, json_file_name)

            # Update only the relevant column
            matched_entry.json_url_manual = json_url_manual
            matched_entry.instrument_filename = json_file_name
            db.commit()
            db.refresh(matched_entry)

            logger.info(f"Updated JSON for existing instrument {matched_entry.instrument_filename}.")
            return {"instrument_name": matched_entry.instrument_filename, "json_url_manual": matched_entry.json_url_manual}
        else:
            # PDF does not match any existing instrument
            logger.error(f"No selected instrument matches extracted models '{extracted_models}'.")
            raise HTTPException(
                status_code=404,
                detail=f"No existing instrument matches extracted models '{extracted_models}'. Please select a valid instrument first."
            )

    except Exception as e:
        db.rollback()
        logger.exception("Failed to process PDF upload")
        raise HTTPException(status_code=500, detail=f"Failed to process PDF upload: {str(e)}")