from fastapi import APIRouter
from pydantic import BaseModel
from . import service
from ..database import DbSession
from uuid import UUID


router = APIRouter(prefix="/instruments", tags=["instruments"])

class InstrumentInfo(BaseModel):
    resource: str
    idn: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    serial: str | None = None
    firmware: str | None = None

@router.get("/scan", response_model=list[InstrumentInfo])
def scan_instruments(db: DbSession):
    return service.scan_instruments(db)


@router.post("/select/{instrument_id}")
def select_instrument(request, instrument_id:UUID, db: DbSession):
    return service.save_selected_instrument(db, request, instrument_id, active=True)

@router.get("/all_instrument")
def get_active( db: DbSession):
    return service.get_all_instrument(db)

@router.get("/selected_instrument/{session_id}")
def get_active( db: DbSession ,session_id:UUID):
    return service.get_all_instrument(db, session_id)

@router.delete("delete/{instrument_id}")
def delete_instrument(instrument_id: UUID, db:DbSession):
    return service.delete_detected_instrument(db, instrument_id)

@router.delete("deleteAll")
def delete_all_instrument( db:DbSession):
    return service.delete_all_detected_instruments(db)


    


