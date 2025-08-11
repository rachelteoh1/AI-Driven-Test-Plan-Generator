from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from fastapi.responses import JSONResponse
from ..database import get_db  # Ensure `get_db` is imported correctly
from sqlalchemy.orm import Session  # Use `Session` instead of `DbSession`
from .service import process_pdf_upload
from .models import PDFUploadResponse
from app.entities.entities import InstrumentMetadata
import logging


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
    instruments = db.query(InstrumentMetadata).all()
    return {
        "instruments": [instrument.__dict__ for instrument in instruments]
    }