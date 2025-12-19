from datetime import timedelta, datetime, timezone
from typing import Annotated
from uuid import UUID, uuid4
from fastapi import Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session
from ..entities.entities import ChatLog, ChatLogVersion, SelectedInstrument
import logging
from ..exceptions import (
    InternalServerError)
from .models import LogCreate, LogResponse, InstrumentResponse
from ..utils.intent_classifier import classify_intent_ml
from ..exceptions import ChatCreationError, ChatNotFoundError,ChatRenameError
from ..pdf_import.utils.suggest_intent import extract_scpi_from_pdf
from ..instrument import service
import requests
import json
from ..optimized_test_sequence import service as opt_service
from . import monitoring_service  # Import monitoring service\
import time
from ..utils.nlp_utils import preprocess_input, format_for_llm, Intent
from ..utils.intent_service import save_intent_metadata
logger = logging.getLogger(__name__)



def create_chat_log(db: Session, request):
    try:
        previous = (
        db.query(ChatLog)
        .filter_by(session_id=request.session_id, is_active=True)
        .order_by(ChatLog.timestamp.desc())
        .first()
    )   
        parent_id = previous.message_id if previous else None
        new_chat_log = ChatLog(
        message_id=uuid4(),
        session_id=request.session_id,
        role=request.role,
        content=request.content,
        timestamp=datetime.now(timezone.utc),
        parent_id=parent_id
        )
        db.add(new_chat_log)
        db.commit()
        db.refresh(new_chat_log)
        logger.info(f"Chat log created for session: {request.session_id}")
        return new_chat_log
    except Exception as e:
        logging.exception(f"Failed to create chat log: {str(e)}")
        raise ChatCreationError(str(e))
    
def deactivate_descendants(db: Session, message_id: UUID, version_id:UUID):
    to_deactivate = db.query(ChatLog).filter_by(parent_id=message_id, is_active=True).all()
    for msg in to_deactivate:
        msg.is_active = False
        msg.version_of = version_id
        deactivate_descendants(db, msg.message_id,version_id)  
    
def modify_chat_log(db: Session, request):
    chat_log = db.query(ChatLog).filter_by(message_id=request.message_id).first()
    if not chat_log:
        raise ChatNotFoundError(request.message_id)
    
    try:
        # Save old version
        version = ChatLogVersion(
            message_id=chat_log.message_id,
            session_id=chat_log.session_id,
            old_content=chat_log.content,
            edited_at=datetime.now(timezone.utc)
        )
        db.add(version)
        db.flush()
        
        # Deactivate all descendants
        deactivate_descendants(db, chat_log.message_id, version.version_id)
        
        # Update current message
        chat_log.content = request.content
        chat_log.updated_at =datetime.now(timezone.utc)
        chat_log.has_been_modified = True
        db.commit()
        db.refresh(chat_log)
        
        llm_request = LogCreate(
            session_id=chat_log.session_id,
            role="llm_response",
            content=chat_log.content
        )
        llm_response = detect_intent(db, llm_request)
      
        return llm_response
    except Exception as e:
        db.rollback()
        raise ChatRenameError(str(e))

def get_chat_log_versions_with_replies(message_id, db: Session):
    try:
        versions = db.query(ChatLogVersion).filter_by(message_id=message_id).order_by(ChatLogVersion.edited_at).all()
        version_data = []

        for v in versions:
            # Find responses that occurred after this version was edited
            children = (
                db.query(ChatLog)
                .filter_by(version_of=v.version_id, is_active=False)
                .order_by(ChatLog.timestamp)
                .all()
            )

            version_data.append({
                "version_id": v.version_id,
                "message_id": v.message_id,
                "session_id": v.session_id,
                "old_content": v.old_content,
                "edited_at": v.edited_at,
                "responses": children
            })

        logger.info(f"Retrieved {len(version_data)} versions for message: {message_id}")
        return version_data  
    except Exception as e:
        logger.error(f"Failed to get previous chat logs for messageid {message_id}: {str(e)}")
        raise InternalServerError(str(e))


def clear_chat_log(db: Session, session_id):
    try:
        deleted = db.query(ChatLog).filter_by(session_id=session_id).delete()
        db.commit()
        logger.info(f"Cleared {deleted} chat logs for session: {session_id}")
    except Exception as e:
        logger.error(f"Failed to clear chat logs for session {session_id}: {str(e)}")
        raise InternalServerError(str(e))


def get_chat_log_by_user(db: Session, session_id):
    try:
        logs = db.query(ChatLog).filter_by(session_id=session_id, is_active=True).order_by(ChatLog.timestamp).all()
        logger.info(f"Retrieved {len(logs)} chat logs for session: {session_id}")
        
        enhanced_logs = []
        for log in logs:
            # Check if this message has optimization
            has_opt = opt_service.has_optimized_sequence(db, log.message_id) if log.role == "llm_response" else False
            
            # Convert to dict and add has_optimization
            log_dict = {
                "message_id": log.message_id,
                "session_id": log.session_id,
                "role": log.role,
                "content": log.content,
                "timestamp": log.timestamp,
                "has_been_modified": log.has_been_modified,
                "has_optimization": has_opt,
                "parent_id": log.parent_id
            }
            enhanced_logs.append(log_dict)
        
        return enhanced_logs
    except Exception as e:
        logger.error(f"Failed to get chat logs for session {session_id}: {str(e)}")
        raise InternalServerError(str(e))


MISTRAL_API_URL = "https://cofinal-semierectly-mignon.ngrok-free.dev/generate"



# def detect_intent(db: Session, request: LogCreate) -> LogResponse:
#     """
#     Detect user intent and generate AI response, automatically including
#     selected instrument information in the user message.
#     """
#     start_time = time.time()
#     try:
#         logger.info(f"Detecting intent for session: {request.session_id}")

#         # --- Step 1: Retrieve the selected instrument(s) for this session ---
#         instruments = service.get_selected_instruments(db, request.session_id)
#         if instruments:
#             selected_instrument = instruments[-1]
#             instrument_prefix = f"Keysight {selected_instrument.model}: "
#         else:
#             selected_instrument = None
#             instrument_prefix = ""

#         # --- Step 2: Construct full user message ---
#         user_msg = f"{instrument_prefix}{request.content.strip()}"
#         logger.info(f"Constructed user message: {user_msg}")

#         # --- Step 3: Send message to Flask API ---
#         payload = {
#             "prompt": user_msg,
#             "max_tokens": 512,
#             "temperature": 0.2
#         }
#         response = requests.post(MISTRAL_API_URL, json=payload, timeout=120)

#         if response.status_code != 200:
#             logger.error(f"Flask API Error: {response.text}")
#             raise Exception(f"Flask API returned {response.status_code}")

#         data = response.json()
#         logger.info(f"Flask API response: {json.dumps(data, indent=2)}")

#         # --- Step 4: Extract response directly from Flask ---
#         formatted_output = data.get("response", "")
#         opt_sequence = data.get("opt_sequence", "")
#         is_explanation = data.get("is_explanation", False)
        
#         if not formatted_output:
#             raise Exception("Flask API returned empty response")

#         logger.info(f"Formatted output length: {len(formatted_output)}")
#         logger.info(f"Is explanation: {is_explanation}")
#         logger.info(f"Optimized sequence: {opt_sequence}")

#         # --- Step 5: Save chat log ---
#         new_log = LogCreate(
#             session_id=request.session_id,
#             role="llm_response",
#             content=formatted_output,
#         )
#         saved_log = create_chat_log(db, new_log)

#         # --- Step 6: Save optimized sequence ONLY if NOT explanation ---
#         if not is_explanation and opt_sequence and opt_sequence.strip():
#             try:
#                 opt_service.save_optimized_sequence(db, saved_log.message_id, opt_sequence)
#                 logger.info(f"Saved optimized sequence for message {saved_log.message_id}")
#             except Exception as e:
#                 logger.exception(f"Failed to save optimized sequence: {str(e)}")
#         elif is_explanation:
#             logger.info(f"Skipping optimization save - this is an explanation response")
#         else:
#             logger.info(f"Skipping optimization save - empty sequence")

#         has_optimization = opt_service.has_optimized_sequence(db, saved_log.message_id)
        
#         # --- Step 7: Build LogResponse object ---
#         log_response = LogResponse(
#             message_id=saved_log.message_id,
#             session_id=saved_log.session_id,
#             role=saved_log.role,
#             content=saved_log.content,
#             timestamp=saved_log.timestamp,
#             has_been_modified=saved_log.has_been_modified,
#             has_optimization=has_optimization,
#             selected_instrument=InstrumentResponse(
#                 manufacturer=selected_instrument.manufacturer,
#                 model=selected_instrument.model,
#                 serial=selected_instrument.serial,
#             ) if selected_instrument else None,
#         )
#         response_time = time.time() - start_time
#         monitoring_service.record_response_time(response_time)
#         logger.info(f"Request completed in {response_time:.3f}s")
#         logger.info(f"Returning LogResponse")
#         return log_response

#     except Exception as e:
#         response_time = time.time() - start_time
#         monitoring_service.record_response_time(response_time)
#         logger.exception("Intent detection failed")
#         raise HTTPException(status_code=500, detail=f"Failed to detect intent: {str(e)}")


# import time
# import json
# import requests
# import logging
# from sqlalchemy.orm import Session
# from fastapi import HTTPException


# logger = logging.getLogger(__name__)

# # Flask API endpoint
# MISTRAL_API_URL = "http://your-flask-api-url/generate"


# def detect_intent(db: Session, request: LogCreate) -> LogResponse:
#     """
#     Detect user intent and generate AI response with enhanced NLP preprocessing,
#     automatically including selected instrument information in the user message.
#     """
#     start_time = time.time()
#     try:
#         logger.info(f"Detecting intent for session: {request.session_id}")

#         # =====================================================================
#         # Step 1: Retrieve the selected instrument(s) for this session
#         # =====================================================================
#         instruments = service.get_selected_instruments(db, request.session_id)
#         if instruments:
#             selected_instrument = instruments[-1]
#             instrument_context = f"Keysight {selected_instrument.model}"
#             logger.info(f"Selected instrument: {instrument_context}")
#         else:
#             selected_instrument = None
#             instrument_context = "Generic SCPI Instrument"
#             logger.warning("No instrument selected for session")

#         # =====================================================================
#         # Step 2: Enhanced NLP Preprocessing
#         # =====================================================================
#         user_input = request.content.strip()
#         logger.info(f"Raw user input: {user_input}")
        
#         # Parse user input with enhanced NLP
#         parsed_input = preprocess_input(user_input)
        
#         logger.info(f"Intent detected: {parsed_input.intent.value} (confidence: {parsed_input.confidence:.2f})")
#         logger.info(f"SCPI commands found: {parsed_input.scpi_commands}")
#         logger.info(f"Measurement types: {parsed_input.measurement_types}")
#         logger.info(f"Conditions: {parsed_input.conditions}")
#         logger.info(f"Targets: {parsed_input.targets}")
#         logger.info(f"Equipment refs: {parsed_input.equipment_refs}")
#         logger.info(f"Action verbs: {parsed_input.action_verbs}")
        
#         # =====================================================================
#         # Step 3: Build enriched context for LLM
#         # =====================================================================
#         # Format the parsed data for LLM consumption
#         enriched_context = format_for_llm(parsed_input)
        
#         # Add instrument context
#         context_with_instrument = f"""Instrument Context: {instrument_context}

# {enriched_context}"""
        
#         logger.info(f"Enriched context:\n{context_with_instrument}")

#         # =====================================================================
#         # Step 4: Determine routing based on intent
#         # =====================================================================
#         # Map our Intent enum to Flask API parameters
#         intent_routing = {
#             Intent.GENERATE_TEST: {
#                 "mode": "generation",
#                 "temperature": 0.3,
#                 "max_tokens": 512
#             },
#             Intent.EXPLAIN_COMMAND: {
#                 "mode": "explanation",
#                 "temperature": 0.2,
#                 "max_tokens": 512
#             },
#             Intent.MODIFY_SEQUENCE: {
#                 "mode": "generation",
#                 "temperature": 0.3,
#                 "max_tokens": 512
#             },
#             Intent.TROUBLESHOOT: {
#                 "mode": "explanation",
#                 "temperature": 0.2,
#                 "max_tokens": 512
#             },
#             Intent.QUERY_CAPABILITY: {
#                 "mode": "explanation",
#                 "temperature": 0.2,
#                 "max_tokens": 384
#             },
#             Intent.UNKNOWN: {
#                 "mode": "generation",
#                 "temperature": 0.3,
#                 "max_tokens": 512
#             }
#         }
        
#         routing_params = intent_routing.get(parsed_input.intent, intent_routing[Intent.UNKNOWN])
        
#         # =====================================================================
#         # Step 5: Send enriched message to Flask API
#         # =====================================================================
#         payload = {
#             "prompt": context_with_instrument,
#             "session_id": str(request.session_id), 
#             "max_tokens": routing_params["max_tokens"],
#             "temperature": routing_params["temperature"],
#             # Include metadata for Flask API
#             "metadata": {
#                 "intent": parsed_input.intent.value,
#                 "confidence": float(parsed_input.confidence),
#                 "scpi_commands": parsed_input.scpi_commands,
#                 "measurement_types": parsed_input.measurement_types,
#                 "conditions": parsed_input.conditions,
#                 "targets": parsed_input.targets,
#                 "equipment_refs": parsed_input.equipment_refs,
#                 "action_verbs": parsed_input.action_verbs,
#                 "temporal_info": parsed_input.temporal_info,
#                 "instrument_model": selected_instrument.model if selected_instrument else None
#             }
#         }
        
#         logger.info(f"Sending to Flask API with intent: {parsed_input.intent.value}")
#         response = requests.post(MISTRAL_API_URL, json=payload, timeout=120)

#         if response.status_code != 200:
#             logger.error(f"Flask API Error: {response.text}")
#             raise Exception(f"Flask API returned {response.status_code}")

#         data = response.json()
#         logger.info(f"Flask API response: {json.dumps(data, indent=2)}")

#         # =====================================================================
#         # Step 6: Extract response from Flask
#         # =====================================================================
#         formatted_output = data.get("response", "")
#         opt_sequence = data.get("opt_sequence", "")
#         is_explanation = data.get("is_explanation", False)
#         needs_clarification = data.get("needs_clarification", False)
        
#         if not formatted_output:
#             raise Exception("Flask API returned empty response")

#         logger.info(f"Response length: {len(formatted_output)}")
#         logger.info(f"Is explanation: {is_explanation}")
#         logger.info(f"Needs clarification: {needs_clarification}")
#         logger.info(f"Optimized sequence: {opt_sequence[:100] if opt_sequence else 'None'}...")

#         # =====================================================================
#         # Step 7: Handle clarification flow
#         # =====================================================================
#         if needs_clarification:
#             logger.info("LLM is requesting clarification from user")
#             # Add a flag in the response to indicate clarification is needed
#             formatted_output = f"[CLARIFICATION_NEEDED]\n\n{formatted_output}"

#         # =====================================================================
#         # Step 8: Save chat log with metadata
#         # =====================================================================
#         new_log = LogCreate(
#             session_id=request.session_id,
#             role="llm_response",
#             content=formatted_output,
#         )
#         saved_log = create_chat_log(db, new_log)
        
#         # Save intent metadata to database (if you have a metadata table)
#         try:
#             save_intent_metadata(
#                 db=db,
#                 message_id=saved_log.message_id,
#                 intent=parsed_input.intent.value,
#                 confidence=parsed_input.confidence,
#                 scpi_commands=parsed_input.scpi_commands,
#                 measurement_types=parsed_input.measurement_types,
#                 conditions=parsed_input.conditions,
#                 targets=parsed_input.targets
#             )
#         except Exception as e:
#             logger.warning(f"Failed to save intent metadata: {str(e)}")

#         # =====================================================================
#         # Step 9: Save optimized sequence (only for generation, not explanation)
#         # =====================================================================
#         should_save_optimization = (
#             not is_explanation and 
#             not needs_clarification and
#             opt_sequence and 
#             opt_sequence.strip() and
#             parsed_input.intent in [Intent.GENERATE_TEST, Intent.MODIFY_SEQUENCE]
#         )
        
#         if should_save_optimization:
#             try:
#                 opt_service.save_optimized_sequence(db, saved_log.message_id, opt_sequence)
#                 logger.info(f"Saved optimized sequence for message {saved_log.message_id}")
#             except Exception as e:
#                 logger.exception(f"Failed to save optimized sequence: {str(e)}")
#         elif is_explanation:
#             logger.info(f"Skipping optimization save - explanation response")
#         elif needs_clarification:
#             logger.info(f"Skipping optimization save - clarification needed")
#         else:
#             logger.info(f"Skipping optimization save - no valid sequence")

#         has_optimization = opt_service.has_optimized_sequence(db, saved_log.message_id)
        
#         # =====================================================================
#         # Step 10: Build enhanced LogResponse object
#         # =====================================================================
#         metadata_dict = {
#             "intent": parsed_input.intent.value,
#             "confidence": parsed_input.confidence,
#             "needs_clarification": needs_clarification,
#             "is_explanation": is_explanation,
#             "scpi_commands_found": len(parsed_input.scpi_commands),
#             "measurement_types": parsed_input.measurement_types,
#             "has_conditions": len(parsed_input.conditions) > 0,
#             "has_targets": len(parsed_input.targets) > 0
#         }
        
#         print(f"DEBUG metadata_dict type: {type(metadata_dict)}")
#         print(f"DEBUG metadata_dict value: {metadata_dict}")
        
        
#         log_response = LogResponse(
#             message_id=saved_log.message_id,
#             session_id=saved_log.session_id,
#             role=saved_log.role,
#             content=saved_log.content,
#             timestamp=saved_log.timestamp,
#             has_been_modified=saved_log.has_been_modified,
#             has_optimization=has_optimization,
#             selected_instrument=InstrumentResponse(
#                 manufacturer=selected_instrument.manufacturer,
#                 model=selected_instrument.model,
#                 serial=selected_instrument.serial,
#             ) if selected_instrument else None,
#             # metadata=metadata_dict
#         )
       
    
        

#         print(f"DEBUG metadata_dict value: {metadata_dict}")
#         # =====================================================================
#         # Step 11: Record metrics and return
#         # =====================================================================
#         elapsed_time = time.time() - start_time
#         response_time = time.time() - start_time
#         monitoring_service.record_response_time(response_time)
#         monitoring_service.intent_monitor.record_intent_classification(
#         intent=parsed_input.intent.value,
#         confidence=parsed_input.confidence,
#         response_time=elapsed_time  # or however you calculate it
#     )
        
#         logger.info(f"Request completed in {response_time:.3f}s")
#         logger.info(f"Returning LogResponse with intent: {parsed_input.intent.value}")
        
#         return log_response

#     except Exception as e:
#         response_time = time.time() - start_time
#         monitoring_service.record_response_time(response_time)
#         logger.exception("Intent detection failed")
#         raise HTTPException(
#             status_code=500, 
#             detail=f"Failed to detect intent: {str(e)}"
#         )





def detect_intent(db: Session, request: LogCreate) -> LogResponse:
    """
    Detect user intent and generate AI response with enhanced NLP preprocessing,
    automatically including selected instrument information in the user message.
    """
    start_time = time.time()
    try:
        logger.info(f"Detecting intent for session: {request.session_id}")

        # =====================================================================
        # Step 1: Retrieve the selected instrument(s) for this session
        # =====================================================================
        instruments = service.get_selected_instruments(db, request.session_id)
        if instruments:
            selected_instrument = instruments[-1]
            instrument_context = f"Keysight {selected_instrument.model}"
            instrument_model = selected_instrument.model
            logger.info(f"Selected instrument: {instrument_context}")
        else:
            selected_instrument = None
            instrument_context = "Generic SCPI Instrument"
            instrument_model = None
            logger.warning("No instrument selected for session")

        # =====================================================================
        # Step 2: Enhanced NLP Preprocessing
        # =====================================================================
        user_input = request.content.strip()
        logger.info(f"Raw user input: {user_input}")
        
        # Parse user input with enhanced NLP
        parsed_input = preprocess_input(user_input)
        
        logger.info(f"Intent detected: {parsed_input.intent.value} (confidence: {parsed_input.confidence:.2f})")
        logger.info(f"SCPI commands found: {parsed_input.scpi_commands}")
        logger.info(f"Measurement types: {parsed_input.measurement_types}")
        
        # =====================================================================
        # Step 3: Check if this is a clarification response
        # =====================================================================
        # You can detect this by checking if there's a pending clarification in DB
        # For now, we'll check if the previous message was a clarification request
        is_clarification_response = False
        
        # Get last message from this session
        
        recent_logs = get_chat_log_by_user(db, request.session_id)
        if recent_logs and "[CLARIFICATION_NEEDED]" in (recent_logs[-1].get("content") or ""):
            is_clarification_response = True
            logger.info("This is a clarification response")

        # =====================================================================
        # Step 4: Build metadata payload for Flask API
        # =====================================================================
        metadata = {
            "intent": parsed_input.intent.value,
            "confidence": float(parsed_input.confidence),
            "scpi_commands": parsed_input.scpi_commands,
            "measurement_types": parsed_input.measurement_types,
            "conditions": parsed_input.conditions,
            "targets": parsed_input.targets,
            "equipment_refs": parsed_input.equipment_refs,
            "action_verbs": parsed_input.action_verbs,
            "temporal_info": parsed_input.temporal_info,
            "instrument_model": instrument_model,
            "original_text": user_input
        }
        
        # =====================================================================
        # Step 5: Determine routing parameters
        # =====================================================================
        intent_routing = {
            Intent.GENERATE_TEST: {
                "temperature": 0.3,
                "max_tokens": 256  # Reduced for speed
            },
            Intent.EXPLAIN_COMMAND: {
                "temperature": 0.2,
                "max_tokens": 256
            },
            Intent.MODIFY_SEQUENCE: {
                "temperature": 0.3,
                "max_tokens": 256
            },
            Intent.TROUBLESHOOT: {
                "temperature": 0.2,
                "max_tokens": 256
            },
            Intent.QUERY_CAPABILITY: {
                "temperature": 0.2,
                "max_tokens": 200
            },
            Intent.UNKNOWN: {
                "temperature": 0.3,
                "max_tokens": 256
            }
        }
        
        routing_params = intent_routing.get(
            parsed_input.intent, 
            intent_routing[Intent.UNKNOWN]
        )
        
        # =====================================================================
        # Step 6: Send request to Flask API
        # =====================================================================
        payload = {
            "prompt": user_input,  # Send original input
            "session_id": str(request.session_id), 
            "max_tokens": routing_params["max_tokens"],
            "temperature": routing_params["temperature"],
            "metadata": metadata,
            "is_clarification": is_clarification_response
        }
        
        logger.info(f"Sending to Flask API with intent: {parsed_input.intent.value}")
        logger.info(f"Is clarification response: {is_clarification_response}")
        
        response = requests.post(MISTRAL_API_URL, json=payload, timeout=(5, 180))

        if response.status_code != 200:
            logger.error(f"Flask API Error: {response.text}")
            raise Exception(f"Flask API returned {response.status_code}")

        data = response.json()
        
        # =====================================================================
        # Step 7: Extract response from Flask
        # =====================================================================
        formatted_output = data.get("response", "")
        opt_sequence = data.get("opt_sequence", "")
        is_explanation = data.get("is_explanation", False)
        needs_clarification = data.get("needs_clarification", False)
        
        if not formatted_output:
            raise Exception("Flask API returned empty response")

        logger.info(f"Response length: {len(formatted_output)}")
        logger.info(f"Is explanation: {is_explanation}")
        logger.info(f"Needs clarification: {needs_clarification}")

        # =====================================================================
        # Step 8: Format response for frontend
        # =====================================================================
        if needs_clarification:
            logger.info("LLM is requesting clarification from user")
            # Mark the response so frontend knows to expect clarification
            formatted_output = f"[CLARIFICATION_NEEDED]\n\n{formatted_output}"

        # =====================================================================
        # Step 9: Save chat log
        # =====================================================================
        new_log = LogCreate(
            session_id=request.session_id,
            role="llm_response",
            content=formatted_output,
        )
        saved_log = create_chat_log(db, new_log)
        
        # Save intent metadata
        try:
            save_intent_metadata(
                db=db,
                message_id=saved_log.message_id,
                intent=parsed_input.intent.value,
                confidence=parsed_input.confidence,
                scpi_commands=parsed_input.scpi_commands,
                measurement_types=parsed_input.measurement_types,
                conditions=parsed_input.conditions,
                targets=parsed_input.targets
            )
        except Exception as e:
            logger.warning(f"Failed to save intent metadata: {str(e)}")

        # =====================================================================
        # Step 10: Save optimized sequence (only if not clarification/explanation)
        # =====================================================================
        should_save_optimization = (
            not is_explanation and 
            not needs_clarification and
            opt_sequence and 
            opt_sequence.strip() and
            parsed_input.intent in [Intent.GENERATE_TEST, Intent.MODIFY_SEQUENCE]
        )
        
        if should_save_optimization:
            try:
                opt_service.save_optimized_sequence(db, saved_log.message_id, opt_sequence)
                logger.info(f"Saved optimized sequence for message {saved_log.message_id}")
            except Exception as e:
                logger.exception(f"Failed to save optimized sequence: {str(e)}")

        has_optimization = opt_service.has_optimized_sequence(db, saved_log.message_id)
        
        # =====================================================================
        # Step 11: Build LogResponse
        # =====================================================================
        log_response = LogResponse(
            message_id=saved_log.message_id,
            session_id=saved_log.session_id,
            role=saved_log.role,
            content=saved_log.content,
            timestamp=saved_log.timestamp,
            has_been_modified=saved_log.has_been_modified,
            has_optimization=has_optimization,
            selected_instrument=InstrumentResponse(
                manufacturer=selected_instrument.manufacturer,
                model=selected_instrument.model,
                serial=selected_instrument.serial,
            ) if selected_instrument else None,
        )

        # =====================================================================
        # Step 12: Record metrics and return
        # =====================================================================
        elapsed_time = time.time() - start_time
        monitoring_service.record_response_time(elapsed_time)
        monitoring_service.intent_monitor.record_intent_classification(
            intent=parsed_input.intent.value,
            confidence=parsed_input.confidence,
            response_time=elapsed_time
        )
        
        logger.info(f"Request completed in {elapsed_time:.3f}s")
        logger.info(f"Returning LogResponse with intent: {parsed_input.intent.value}")
        
        # Add metadata about clarification to response if needed
        if needs_clarification:
            logger.info("Response contains clarification request")
        
        return log_response

    except requests.Timeout:
        response_time = time.time() - start_time
        monitoring_service.record_response_time(response_time)
        logger.error("Flask API request timed out")
        raise HTTPException(
            status_code=504, 
            detail="Request timed out. Please try again."
        )
    except Exception as e:
        response_time = time.time() - start_time
        monitoring_service.record_response_time(response_time)
        logger.exception("Intent detection failed")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to detect intent: {str(e)}"
        )


def handle_clarification_response(
    db: Session, 
    session_id: UUID, 
    clarification: str
) -> LogResponse:
    """
    Handle user's response to a clarification request.
    This is a specialized version of detect_intent for clarification flow.
    """
    # Create a log request for the clarification
    request = LogCreate(
        session_id=session_id,
        role="user",
        content=clarification
    )
    
    # Process it - the detect_intent function will detect it's a clarification response
    return detect_intent(db, request)