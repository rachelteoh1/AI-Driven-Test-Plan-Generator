from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from fastapi.responses import JSONResponse
from ..database import get_db  # Ensure `get_db` is imported correctly
from sqlalchemy.orm import Session  # Use `Session` instead of `DbSession`
from .service import process_pdf_upload
from .models import PDFUploadResponse
import logging
from .utils.suggest_intent import *
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
    
# @router.post("/test-process-scpi")
# async def test_process_scpi(prompt: str):
#     """
#     Endpoint to test the process_scpi_text function.
#     """
#     try:
#         result = process_scpi_text(prompt)
#         return JSONResponse(content={"result": result})
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error processing SCPI text: {str(e)}")

    
@router.post("/test-extract-actual_scpi")
async def extract_actual_scpi(file: UploadFile = File(...)):
    """
    Endpoint to extract SCPI commands and metadata from a PDF file.
    """
    if not file:
        raise HTTPException(status_code=422, detail="No file uploaded")
    try:
        file_bytes = await file.read()  # Read file as bytes
        result = extract_scpi_commands_from_toc(file_bytes)  # Pass bytes, not UploadFile
        result["total_scpi_commands"] = len(result.get("scpi_commands", []))
        return JSONResponse(content=result)
    except Exception as e:
        logging.exception("Failed to extract SCPI commands from PDF")
        raise HTTPException(status_code=500, detail=f"Error extracting SCPI commands: {str(e)}")

@router.post("/test-extract-scpi-from-pdf")
async def extract_scpi_from_pdf_endpoint(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=422, detail="No file uploaded")
    try:
        file_bytes = await file.read()
        result = extract_scpi_from_pdf(file_bytes)  # accuracy is calculated inside
        return JSONResponse(content=result)
    except Exception as e:
        logging.exception("Failed to extract SCPI commands from PDF")
        raise HTTPException(status_code=500, detail=f"Error extracting SCPI commands: {str(e)}")