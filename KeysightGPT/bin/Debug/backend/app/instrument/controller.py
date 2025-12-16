from fastapi import APIRouter
from pydantic import BaseModel
from . import service
from ..database import DbSession
from uuid import UUID
from typing import List



router = APIRouter(prefix="/instruments", tags=["instruments"])

class InstrumentInfo(BaseModel):
    id: UUID | None = None
    resource_string: str
    idn: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    serial: str | None = None
    firmware: str | None = None
    instrument_filename: str | None = None
    json_url_manual: str | None = None  # Add this field

class InstrumentSelectedRequest(BaseModel):
    session_id: UUID
    message_id:UUID
   
class InstrumentSelectedResponse(BaseModel):
    id: UUID
    session_id: UUID
    message_id: UUID
    resource_string: str
    idn: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    serial: str | None = None
    firmware: str | None = None
    instrument_filename: str | None = None
    json_url_manual: str | None = None

class AllInstrumentResponse(BaseModel):
    id: UUID
    resource_string: str
    idn: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    serial: str | None = None
    firmware: str | None = None
    instrument_filename: str | None = None
    json_url_manual: str | None = None
   
   
   


@router.get("/scan", response_model=list[InstrumentInfo])
def scan_instruments(db: DbSession):
    return service.scan_instruments(db)


@router.post("/select/{instrument_id}/{session_id}")
def select_instrument(instrument_id:UUID, session_id:UUID, db: DbSession):
    return service.save_selected_instrument(db, instrument_id, session_id)

#update chatlog id
@router.post("/update/{selected_id}/{message_id}")
def update_instrument(selected_id:UUID,message_id:UUID, db: DbSession):
    return service.update_selected_instrument(db, selected_id,message_id)

@router.post("/save/")
def save_instrument(request:InstrumentInfo, db: DbSession):
    return service.save_detected_instrument(db, request)

@router.get("/all_instrument",response_model=List[AllInstrumentResponse])
def get_all_instrument( db: DbSession):
    return service.get_all_instrument(db)

@router.get("/selected_instrument/{session_id}",response_model=List[InstrumentSelectedResponse])
def get_selected_instruments( db: DbSession ,session_id:UUID):
    return service.get_selected_instruments(db, session_id)

@router.delete("/delete/{instrument_id}")
def delete_instrument(instrument_id: UUID, db:DbSession):
    return service.delete_detected_instrument(db, instrument_id)

@router.delete("/deleteAll")
def delete_all_instrument(db:DbSession):
    return service.delete_all_detected_instruments(db)





