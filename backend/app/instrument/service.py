from datetime import timedelta, datetime, timezone
from typing import Annotated
from uuid import UUID, uuid4
from fastapi import Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session
import logging
from ..exceptions import (
    InternalServerError)
from ..utils.intent_classifier import classify_intent_ml
from ..utils.nlp_utils import preprocess_input
from ..exceptions import ChatCreationError, ChatNotFoundError,ChatRenameError
from ..entities.entities import DetectedInstrument,SelectedInstrument
import pyvisa
from sqlalchemy.exc import SQLAlchemyError
from ..pdf_import.utils.supabase import delete_from_supabase

logger = logging.getLogger(__name__)


# --- Save selected instrument ---
def save_selected_instrument(db: Session, instrument_id: UUID, session_id: UUID, chatlog_id: UUID = None):
    try:
        instrument = db.query(DetectedInstrument).filter_by(id=instrument_id).first()
        if not instrument:
            raise HTTPException(status_code=404, detail=f"Instrument {instrument_id} not found")
        
        # Check if already selected for this session
        selected = db.query(SelectedInstrument).filter_by(
            instrument_id=instrument_id,
            session_id=session_id
        ).first()
        
        if selected:
            # Optionally update message_id or other fields if needed
            if chatlog_id:
                selected.message_id = chatlog_id
                db.commit()
                db.refresh(selected)
            logger.info(f"Instrument already selected: {selected.instrument_id})")
            return selected

        # Otherwise, create new selection
        selected = SelectedInstrument(
            instrument_id=instrument_id,
            session_id=session_id,
            message_id=chatlog_id,
            resource_string=instrument.resource_string,
            idn=instrument.idn,
            manufacturer=instrument.manufacturer,
            model=instrument.model,
            serial=instrument.serial,
            firmware=instrument.firmware,
            json_url=instrument.json_url,
            instrument_filename=None,
            json_url_manual=None,
        )

        db.add(selected)
        db.commit()
        db.refresh(selected)
        logger.info(f"Instrument selected: {selected.instrument_id})")
        return selected
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving selected instrument: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save selected instrument")
    
def update_selected_instrument(db: Session, selected_id: UUID, message_id: UUID):
    try:
        selected = db.query(SelectedInstrument).filter_by(id=selected_id).first()
        if not selected:
            raise HTTPException(status_code=404, detail=f"SelectedInstrument {id} not found")

        selected.message_id = message_id 

        db.commit()
        db.refresh(selected)

        logger.info(f"Updated message_id for SelectedInstrument {id} → {message_id}")
        return selected
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating selected instrument: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update selected instrument")


# --- Get all selected instruments for session ---
def get_selected_instruments(db: Session, session_id: UUID):
    try:
        instruments = db.query(SelectedInstrument).filter_by(session_id=session_id).all()
        logger.info(f"Retrieved {len(instruments)} selected instruments for session {session_id}")
        return instruments
    except Exception as e:
        logger.error(f"Error retrieving selected instruments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve selected instruments")

 
def get_all_instrument(db: Session):
    try:
        instrument = db.query(DetectedInstrument).all()
        if instrument:
            logger.info(f"Retrieved {len(instrument)} instruments for all")
        else:
            logger.info("No instrument set ")
        return instrument
    except Exception as e:
        logger.error(f"Error retrieving all instrument: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve all instrument")
    
SIMULATED_INSTRUMENTS = [
    {
        "resource": "USB0::0x2A8D::00000001::INSTR",
        "idn": "Keysight Technologies,34450A,MY00000001,5.0.0.0",
        "manufacturer": "Keysight Technologies",
        "model": "34450A",
        "serial": "MY00000001",
        "firmware": "5.0.0.0",
    },
    {
        "resource": "USB0::0x2A8D::00000002::INSTR",
        "idn": "Keysight Technologies,N6705B,MY00000002,1.1.0",
        "manufacturer": "Keysight Technologies",
        "model": "N6705B",
        "serial": "MY00000002",
        "firmware": "1.1.0",
    },
    {
        "resource": "USB0::0x2A8D::00000003::INSTR",
        "idn": "Keysight Technologies,MSOX3034T,MY00000003,02.41.2017042600",
        "manufacturer": "Keysight Technologies",
        "model": "MSOX3034T",
        "serial": "MY00000003",
        "firmware": "02.41.2017042600",
    },
    {
        "resource": "TCPIP0::127.0.0.1::inst0::INSTR",
        "idn": "Keysight Technologies,E5071C,MY00000004,A.09.33",
        "manufacturer": "Keysight Technologies",
        "model": "E5071C",
        "serial": "MY00000004",
        "firmware": "A.09.33",
    },
    {
        "resource": "USB0::0x2A8D::00000004::INSTR",
        "idn": "Keysight Technologies,E5071C,MY00000005,A.09.33",
        "manufacturer": "Keysight Technologies",
        "model": "PZ2100A",
        "serial": "MY00000005",
        "firmware": "0.16.29.0",
    },
    {
        "resource": "USB0::0x2A8D::00000005::INSTR",
        "idn": "Keysight Technologies,E5071C,MY00000006,A.09.34",
        "manufacturer": "Keysight Technologies",
        "model": "53220A",
        "serial": "MY00000006",
        "firmware": "0.16.29.1",
    },
]

# --- Scan and update DB 
def scan_instruments(db: Session, timeout_ms: int = 800):
    """Scan VISA resources, update DB, and return active instruments."""

    rm = pyvisa.ResourceManager()
    resources = rm.list_resources()
    detected = []
    
    # detected = SIMULATED_INSTRUMENTS.copy()

    # 1. Scan VISA
    for res in resources:
        idn = None
        manufacturer = model = serial = firmware = None
        inst = None
        try:
            inst = rm.open_resource(res, open_timeout=timeout_ms)
            inst.timeout = timeout_ms
            idn = inst.query("*IDN?").strip()
            parts = [p.strip() for p in idn.split(",")]
            manufacturer = parts[0] if len(parts) > 0 else None
            model = parts[1] if len(parts) > 1 else None
            serial = parts[2] if len(parts) > 2 else None
            firmware = parts[3] if len(parts) > 3 else None
        except Exception:
            pass
        finally:
            try:
                inst and inst.close()
            except Exception:
                pass

        detected.append({
            "resource": res,
            "idn": idn,
            "manufacturer": manufacturer,
            "model": model,
            "serial": serial,
            "firmware": firmware,
        })

    rm.close()

    # 2. Update DB
    try:
        db.query(DetectedInstrument).update({DetectedInstrument.is_active: False})
        resource_strings = []
        for inst in detected:
            resource_strings.append(inst["resource"])
            existing = db.query(DetectedInstrument).filter_by(resource_string=inst["resource"]).first()
            if existing:
                existing.idn = inst.get("idn")
                existing.manufacturer = inst.get("manufacturer")
                existing.model = inst.get("model")
                existing.serial = inst.get("serial")
                existing.firmware = inst.get("firmware")
                existing.is_active = True
                existing.last_seen = datetime.now(timezone.utc)
            else:
                new_inst = DetectedInstrument(
                    resource_string=inst["resource"],
                    idn=inst.get("idn"),
                    manufacturer=inst.get("manufacturer"),
                    model=inst.get("model"),
                    serial=inst.get("serial"),
                    firmware=inst.get("firmware"),
                    is_active=True,
                    last_seen=datetime.now(timezone.utc),
                )
                db.add(new_inst)

        db.commit()
        logger.info("Scan + Rescan completed successfully")

    except SQLAlchemyError as e:
        db.rollback()
        logger.exception("Error during scan_and_rescan")
        raise

    # 3. Return active instruments
    return (
    db.query(DetectedInstrument)
    .filter(DetectedInstrument.resource_string.in_(resource_strings))
    .all()
)

def delete_detected_instrument(db: Session, instrument_id: UUID):
    try:
        instrument = db.query(DetectedInstrument).filter_by(id=instrument_id).first()
        if not instrument:
            logger.warning(f"Instrument {instrument_id} not found for deletion")
            return False
        
        selected_instruments = db.query(SelectedInstrument).filter_by(
            instrument_id=instrument_id
        ).all()
        
        logger.info(f"Found {len(selected_instruments)} selected instruments to delete")
        
        # Delete Supabase files for each selected instrument
        bucket_name = "scpi-json"
        for selected in selected_instruments:
            if selected.instrument_filename:
                try:
                    delete_from_supabase(bucket_name, selected.instrument_filename)
                    logger.info(f"Deleted Supabase file: {selected.instrument_filename}")
                except Exception as e:
                    logger.warning(f"Failed to delete Supabase file {selected.instrument_filename}: {e}")
            
            # Delete the selected instrument record
            db.delete(selected)
            logger.info(f"Deleted selected instrument: {selected.id}")
        
        db.delete(instrument)
        db.commit()
        logger.info(f"Instrument {instrument_id} deleted")
        return True
    except Exception as e:
        logger.error(f"Failed to delete instrument {instrument_id}: {e}")
        db.rollback()
        raise

def delete_all_detected_instruments(db: Session):
    try:
        count = db.query(DetectedInstrument).delete()
        all_selected = db.query(SelectedInstrument).all()
        selected_count = db.query(SelectedInstrument).delete()
        bucket_name = "scpi-json"
        for selected in all_selected:
            if selected.instrument_filename:
                try:
                    delete_from_supabase(bucket_name, selected.instrument_filename)
                    logger.info(f"Deleted Supabase file: {selected.instrument_filename}")
                except Exception as e:
                    logger.warning(f"Failed to delete Supabase file {selected.instrument_filename}: {e}")
                    
        db.commit()
        logger.info(f"Deleted {count} detected instruments, {selected_count} selected instruments")
        return count
    except Exception as e:
        logger.error(f"Failed to delete all detected instruments: {e}")
        db.rollback()
        raise


# --- Get currently active instrument ---
# def get_active_instrument(db: Session, session_id: UUID):
#     try:
#         instrument = db.query(SelectedInstrument).filter_by(session_id=session_id, is_active=True).first()
#         if instrument:
#             logger.info(f"Active instrument found: {instrument.instrument_id}")
#         else:
#             logger.info("No active instrument set for session")
#         return instrument
#     except Exception as e:
#         logger.error(f"Error retrieving active instrument: {str(e)}")
#         raise HTTPException(status_code=500, detail="Failed to retrieve active instrument")
   


# # --- Save detected instruments ---
def save_detected_instrument(db: Session, inst):
    try:
        instrument = DetectedInstrument(
             resource_string=uuid4(),
                    idn=inst.idn,
                    manufacturer=inst.manufacturer,
                    model=inst.model,
                    serial=inst.serial,
                    firmware=inst.firmware,
                    is_active=True,
                    last_seen=datetime.now(timezone.utc),
                    created_at= datetime.now(timezone.utc)
                )      
        
        db.add(instrument)
        db.commit()
        db.refresh(instrument)
        logger.info(f"Instrument detected and saved: {instrument.model}")
        return instrument
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving detected instrument: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save detected instrument")


# # --- Retrieve detected instruments by session ---
# def get_detected_instruments(db: Session, session_id: UUID):
#     try:
#         instruments = db.query(DetectedInstrument).filter_by(session_id=session_id).all()
#         logger.info(f"Retrieved {len(instruments)} detected instruments for session {session_id}")
#         return instruments
#     except Exception as e:
#         logger.error(f"Error retrieving detected instruments: {str(e)}")
#         raise HTTPException(status_code=500, detail="Failed to retrieve detected instruments")

