from pydantic import BaseModel

class PDFUploadResponse(BaseModel):
    instrument_name: str
    json_url: str
