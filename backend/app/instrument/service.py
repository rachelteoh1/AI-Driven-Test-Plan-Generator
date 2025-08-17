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

logger = logging.getLogger(__name__)


# --- Save selected instrument ---
def save_selected_instrument(db: Session, session_id: UUID, instrument_id: UUID, chatlog_id: UUID = None, active: bool = False):
    try:
        selected = SelectedInstrument(
            instrument_id=instrument_id,
            session_id=session_id,
            chatlog_id=chatlog_id,
            is_active=active
        )
        if active:
            # Deactivate others first
            db.query(SelectedInstrument).filter_by(session_id=session_id).update({"is_active": False})

        db.add(selected)
        db.commit()
        db.refresh(selected)
        logger.info(f"Instrument selected: {selected.instrument_id} (active={selected.is_active})")
        return selected
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving selected instrument: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save selected instrument")


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
        instrument = db.query(SelectedInstrument).all()
        if instrument:
            logger.info(f"instrument found: {instrument.instrument_id}")
        else:
            logger.info("No instrument set for session")
        return instrument
    except Exception as e:
        logger.error(f"Error retrieving active instrument: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve active instrument")
    




# --- Scan and update DB in one go ---
def scan_instruments(db: Session, timeout_ms: int = 800):
    """Scan VISA resources, update DB, and return active instruments."""

    rm = pyvisa.ResourceManager()
    resources = rm.list_resources()
    detected = []

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

        for inst in detected:
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
    return db.query(DetectedInstrument).all()

def delete_detected_instrument(db: Session, instrument_id: UUID):
    try:
        instrument = db.query(DetectedInstrument).filter_by(id=instrument_id).first()
        if not instrument:
            logger.warning(f"Instrument {instrument_id} not found for deletion")
            return False
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
        db.commit()
        logger.info(f"Deleted {count} detected instruments")
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
# def save_detected_instrument(db: Session, session_id: UUID, name: str, json_url: str):
#     try:
#         instrument = DetectedInstrument(
#             instrument_name=name,
#             json_url=json_url,
#             session_id=session_id
#         )
#         db.add(instrument)
#         db.commit()
#         db.refresh(instrument)
#         logger.info(f"Instrument detected and saved: {instrument.instrument_name}")
#         return instrument
#     except Exception as e:
#         db.rollback()
#         logger.error(f"Error saving detected instrument: {str(e)}")
#         raise HTTPException(status_code=500, detail="Failed to save detected instrument")


# # --- Retrieve detected instruments by session ---
# def get_detected_instruments(db: Session, session_id: UUID):
#     try:
#         instruments = db.query(DetectedInstrument).filter_by(session_id=session_id).all()
#         logger.info(f"Retrieved {len(instruments)} detected instruments for session {session_id}")
#         return instruments
#     except Exception as e:
#         logger.error(f"Error retrieving detected instruments: {str(e)}")
#         raise HTTPException(status_code=500, detail="Failed to retrieve detected instruments")

