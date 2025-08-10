from fastapi import APIRouter, File, UploadFile, Form, Depends
from fastapi.responses import JSONResponse
from fastapi import status
from ..database import DbSession
from uuid import UUID
from .service import process_pdf_upload
from .models import PDFUploadResponse

router = APIRouter(
    prefix='/pdf',
    tags=['pdf']
)

@router.post("/upload", response_model=PDFUploadResponse)
async def upload_pdf(db: DbSession, session_id: UUID = Form(...), file: UploadFile = File(...)):
    result = process_pdf_upload(db, file)
    return JSONResponse(content=result)