from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from uuid import UUID
from .utils.suggest_intent import extract_scpi_from_pdf
from ..entities.entities import PDFImport, SelectedInstrument
from .utils.supabase import upload_to_supabase
import logging


logger = logging.getLogger(__name__)

def process_pdf_upload(db: Session, file: UploadFile):
    try:
        file_bytes = file.file.read()
        # Extract instrument name(s) and SCPI commands from PDF
        extracted_data = extract_scpi_from_pdf(file_bytes)
        instrument_name = extracted_data["instrument_name"]
        scpi_commands = extracted_data["scpi_commands"]
        
        # Upload JSON to Supabase
        bucket_name = "scpi-json"
        json_file_name = f"{instrument_name}.json"
        json_url_manual = upload_to_supabase(bucket_name, scpi_commands, json_file_name)

        # Check if this instrument already exists in PDFImport table
        existing_pdf = db.query(PDFImport).filter_by(instrument_filename=json_file_name).first()
        
        if existing_pdf:
            # Update existing entry
            existing_pdf.json_url_manual = json_url_manual
            db.commit()
            db.refresh(existing_pdf)
            logger.info(f"Updated PDF import for {json_file_name}")
        else:
            # Create new entry
            new_pdf = PDFImport(
                instrument_filename=json_file_name,
                json_url_manual=json_url_manual
            )
            db.add(new_pdf)
            db.commit()
            db.refresh(new_pdf)
            logger.info(f"Created new PDF import for {json_file_name}")
        
        # Update all SelectedInstrument entries that match this instrument
        extracted_models = [m.lower() for m in instrument_name.split("_")]
        all_selected = db.query(SelectedInstrument).all()
        
        updated_count = 0
        for selected in all_selected:
            if selected.model and selected.model.lower() in extracted_models:
                selected.json_url_manual = json_url_manual
                updated_count += 1
        
        if updated_count > 0:
            db.commit()
            logger.info(f"Updated {updated_count} selected instruments with new PDF link")

        return {
            "instrument_name": json_file_name,
            "json_url_manual": json_url_manual,
            "updated_selected_instruments": updated_count
        }

    except Exception as e:
        db.rollback()
        logger.exception("Failed to process PDF upload")
        raise HTTPException(status_code=500, detail=f"Failed to process PDF upload: {str(e)}")