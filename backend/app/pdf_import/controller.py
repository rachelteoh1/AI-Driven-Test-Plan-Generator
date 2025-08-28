from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from fastapi.responses import JSONResponse
from ..database import get_db  # Ensure `get_db` is imported correctly
from sqlalchemy.orm import Session  # Use `Session` instead of `DbSession`
from .service import process_pdf_upload
from .models import PDFUploadResponse
import logging
from .utils.suggest_intent import extract_scpi_pages
from ..entities.entities import SelectedInstrument

router = APIRouter(
    prefix='/pdf',
    tags=['pdf']
)

@router.post("/upload", response_model=PDFUploadResponse)
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file:
        raise HTTPException(status_code=422, detail="No file uploaded")
    result = process_pdf_upload(db, file)
    return JSONResponse(content=result)

@router.get("/instruments")
async def get_all_instruments(db: Session = Depends(get_db)):
    instruments = db.query(SelectedInstrument).all()
    return {
        "instruments": [instrument.__dict__ for instrument in instruments]
    }
    
@router.post("/test-extract-scpi")
async def test_extract_scpi(file: UploadFile = File(...)):
    """
    Endpoint to test the extract_scpi_pages function.
    This does not save any data to the database.
    """
    if not file:
        raise HTTPException(status_code=422, detail="No file uploaded")

    try:
        # Call the extract_scpi_pages function
        instrument_name, scpi_pages = extract_scpi_pages(file)

        # Return the extracted data as a response
        return JSONResponse(content={
            "instrument_name": instrument_name,
            "scpi_pages": scpi_pages
        })
    except Exception as e:
        logging.exception("Failed to extract SCPI pages")
        raise HTTPException(status_code=500, detail=f"Error extracting SCPI pages: {str(e)}")