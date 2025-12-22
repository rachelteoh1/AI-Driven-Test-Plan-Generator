# from datetime import timedelta, datetime, timezone
# import time
# from typing import Annotated
# from uuid import UUID, uuid4
# from fastapi import Depends, HTTPException, UploadFile
# from sqlalchemy.orm import Session

# from ..chat_logs import monitoring_service
# from ..entities.entities import ChatLog, ChatLogVersion, SelectedInstrument
# import logging
# from ..exceptions import (
#     InternalServerError)
# from .models import LogCreate, LogResponse, InstrumentResponse
# from ..utils.intent_classifier import classify_intent_ml
# from ..exceptions import ChatCreationError, ChatNotFoundError,ChatRenameError
# from ..pdf_import.utils.suggest_intent import extract_scpi_from_pdf
# from ..instrument import service
# import requests
# import json
# from ..optimized_test_sequence import service as opt_service
# from sentence_transformers import SentenceTransformer
# import numpy as np
# from sklearn.metrics.pairwise import cosine_similarity
# from . import monitoring_service  # Import monitoring service\
# import time
# from ..utils.nlp_utils import preprocess_input, format_for_llm, Intent,process_user_input, context_manager
# from ..utils.intent_service import save_intent_metadata
# logger = logging.getLogger(__name__)

# def detect_intent(db: Session, request: LogCreate) -> LogResponse:
#     """
#     Detect user intent and generate AI response with enhanced NLP preprocessing,
#     RAG semantic search, and clarification handling.
#     Automatically includes selected instrument information in the user message.
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
#             instrument_model = selected_instrument.model
#             instrument_prefix = f"Keysight {selected_instrument.model}: "
#             logger.info(f"Selected instrument: {instrument_context}")
#         else:
#             selected_instrument = None
#             instrument_context = "Generic SCPI Instrument"
#             instrument_model = None
#             instrument_prefix = ""
#             logger.warning("No instrument selected for session")

#         # =====================================================================
#         # Step 2: Enhanced NLP Preprocessing
#         # =====================================================================
#         user_input = request.content.strip()

#         parsed_input = preprocess_input(user_input)

#         logger.info(
#             "\n"
#             "┌───────────────────────── NLP PARSE RESULT ─────────────────────────┐\n"
#             "│ Raw User Input        │ %-45s │\n"
#             "│ Intent Detected       │ %-45s │\n"
#             "│ Confidence            │ %-45s │\n"
#             "│ Intent Reasoning      │ %-45s │\n"
#             "│ SCPI Commands         │ %-45s │\n"
#             "│ Measurement Types     │ %-45s │\n"
#             "│ Conditions            │ %-45s │\n"
#             "│ Targets               │ %-45s │\n"
#             "└─────────────────────────────────────────────────────────────────────┘",
#             user_input[:45],
#             parsed_input.intent.value,
#             f"{parsed_input.confidence:.2f}",
#             parsed_input.intent_reasoning,
#             ", ".join(parsed_input.scpi_commands) or "None",
#             ", ".join(parsed_input.measurement_types) or "None",
#             ", ".join(parsed_input.conditions) or "None",
#             ", ".join(parsed_input.targets) or "None",
# )

        
#         # =====================================================================
#         # Step 3: Check if this is a clarification response
#         # =====================================================================
#         is_clarification_response = False
        
#         # Get last message from this session
#         recent_logs = get_chat_log_by_user(db, request.session_id)
#         if recent_logs and "[CLARIFICATION_NEEDED]" in (recent_logs[-1].get("content") or ""):
#             is_clarification_response = True
#             logger.info("This is a clarification response")

#         # =====================================================================
#         # Step 4: Perform RAG Semantic Search on SCPI Commands
#         # =====================================================================
#         rag_context_text = ""
#         if selected_instrument and selected_instrument.json_url_manual:
#             try:
#                 # Fetch SCPI commands from instrument JSON
#                 logger.info(f"Fetching SCPI commands from: {selected_instrument.json_url_manual}")
#                 import requests as req
#                 json_response = req.get(selected_instrument.json_url_manual, timeout=10)
                
#                 if json_response.status_code == 200:
#                     scpi_data = json_response.json()
                    
#                     # Expecting flat array of SCPI commands
#                     if not isinstance(scpi_data, list):
#                         logger.warning(f"Expected list of commands, got {type(scpi_data)}")
#                         scpi_data = []
                    
#                     logger.info(f"Loaded {len(scpi_data)} SCPI commands")
                    
#                     # Perform semantic search
#                     relevant_commands = perform_semantic_search(scpi_data, user_input, top_k=5)
                    
#                     # Build RAG context text
#                     if relevant_commands:
#                         rag_context_text = "\n\nRelevant SCPI Commands from Documentation:\n"
#                         for idx, cmd_data in enumerate(relevant_commands, 1):
#                             cmd_info = f"{idx}. {cmd_data.get('command', '')}"
#                             if cmd_data.get('description'):
#                                 cmd_info += f" - {cmd_data.get('description')}"
#                             if cmd_data.get('parameters'):
#                                 params = cmd_data.get('parameters', [])
#                                 if isinstance(params, list):
#                                     cmd_info += f"\n   Parameters: {', '.join(params)}"
#                             if cmd_data.get('values'):
#                                 cmd_info += f"\n   Values: {cmd_data.get('values', '')}"
#                             if cmd_data.get('page'):
#                                 cmd_info += f" (Page {cmd_data.get('page')})"
#                             rag_context_text += cmd_info + "\n"
#                         logger.info(f"RAG context built with {len(relevant_commands)} commands")
#                 else:
#                     logger.warning(f"Failed to fetch SCPI JSON: {json_response.status_code}")
#             except Exception as e:
#                 logger.error(f"Error performing semantic search: {str(e)}")

#         # =====================================================================
#         # Step 5: Construct enhanced user message with RAG context
#         # =====================================================================
#         user_msg = f"{instrument_prefix}{user_input}"
#         enhanced_prompt = user_msg + rag_context_text
#         logger.info(f"Constructed user message: {user_msg}")
#         logger.info(f"Enhanced prompt with RAG: {enhanced_prompt[:200]}...")

#         # =====================================================================
#         # Step 6: Build metadata payload for Flask API
#         # =====================================================================
#         metadata = {
#             "intent": parsed_input.intent.value,
#             "confidence": float(parsed_input.confidence),
#             "scpi_commands": parsed_input.scpi_commands,
#             "measurement_types": parsed_input.measurement_types,
#             "conditions": parsed_input.conditions,
#             "targets": parsed_input.targets,
#             "equipment_refs": parsed_input.equipment_refs,
#             "action_verbs": parsed_input.action_verbs,
#             "temporal_info": parsed_input.temporal_info,
#             "instrument_model": instrument_model,
#             "original_text": user_input
            
#         }
        
#         # =====================================================================
#         # Step 7: Determine routing parameters based on intent
#         # =====================================================================
#         intent_routing = {
#             Intent.GENERATE_TEST: {
#                 "temperature": 0.3,
#                 "max_tokens": 256  # Reduced for speed
#             },
#             Intent.EXPLAIN_COMMAND: {
#                 "temperature": 0.2,
#                 "max_tokens": 256
#             },
#             Intent.MODIFY_SEQUENCE: {
#                 "temperature": 0.3,
#                 "max_tokens": 256
#             },
#             Intent.TROUBLESHOOT: {
#                 "temperature": 0.2,
#                 "max_tokens": 256
#             },
#             Intent.QUERY_CAPABILITY: {
#                 "temperature": 0.2,
#                 "max_tokens": 200
#             },
#             Intent.UNKNOWN: {
#                 "temperature": 0.3,
#                 "max_tokens": 256
#             }
#         }
        
#         routing_params = intent_routing.get(
#             parsed_input.intent, 
#             intent_routing[Intent.UNKNOWN]
#         )
        
#         # =====================================================================
#         # Step 8: Send request to Flask API
#         # =====================================================================
#         payload = {
#             "prompt": enhanced_prompt,  # Send enhanced prompt with RAG
#             "session_id": str(request.session_id), 
#             "max_tokens": routing_params["max_tokens"],
#             "temperature": routing_params["temperature"],
#             "metadata": metadata,
#             "is_clarification": is_clarification_response
#         }
        
#         logger.info(f"Sending to Flask API with intent: {parsed_input.intent.value}")
#         logger.info(f"Is clarification response: {is_clarification_response}")
        
#         response = requests.post(MISTRAL_API_URL, json=payload, timeout=(5, 180))

#         if response.status_code != 200:
#             logger.error(f"Flask API Error: {response.text}")
#             raise Exception(f"Flask API returned {response.status_code}")

#         data = response.json()
#         logger.info(f"Flask API response: {json.dumps(data, indent=2)}")
        
#         # =====================================================================
#         # Step 9: Extract response from Flask
#         # =====================================================================
#         formatted_output = data.get("response", "")
#         opt_sequence = data.get("opt_sequence", "")
#         is_explanation = data.get("is_explanation", False)
#         needs_clarification = data.get("needs_clarification", False)
        
#         if not formatted_output:
#             raise Exception("Flask API returned empty response")

#         logger.info(f"Response length: {len(formatted_output)}")
#         logger.info(f"Formatted output length: {len(formatted_output)}")
#         logger.info(f"Is explanation: {is_explanation}")
#         logger.info(f"Needs clarification: {needs_clarification}")
#         logger.info(f"Optimized sequence: {opt_sequence}")

#         # =====================================================================
#         # Step 10: Format response for frontend (clarification handling)
#         # =====================================================================
#         if needs_clarification:
#             logger.info("LLM is requesting clarification from user")
#             # Mark the response so frontend knows to expect clarification
#             formatted_output = f"[CLARIFICATION_NEEDED]\n\n{formatted_output}"

#         # =====================================================================
#         # Step 11: Save chat log
#         # =====================================================================
#         new_log = LogCreate(
#             session_id=request.session_id,
#             role="llm_response",
#             content=formatted_output,
#         )
#         saved_log = create_chat_log(db, new_log)
        
#         # Save intent metadata
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
#         # Step 12: Save optimized sequence (only if not clarification/explanation)
#         # =====================================================================
#         should_save_optimization = (
#             not is_explanation and 
#             not needs_clarification and
#             opt_sequence and 
#             opt_sequence.strip()
#             # parsed_input.intent in [Intent.GENERATE_TEST, Intent.MODIFY_SEQUENCE]
#         )
        
#         if should_save_optimization:
#             try:
#                 opt_service.save_optimized_sequence(db, saved_log.message_id, opt_sequence)
#                 logger.info(f"Saved optimized sequence for message {saved_log.message_id}")
#             except Exception as e:
#                 logger.exception(f"Failed to save optimized sequence: {str(e)}")
#         elif is_explanation:
#             logger.info(f"Skipping optimization save - this is an explanation response")
#         elif needs_clarification:
#             logger.info(f"Skipping optimization save - clarification needed")
#         else:
#             logger.info(f"Skipping optimization save - empty sequence")

#         has_optimization = opt_service.has_optimized_sequence(db, saved_log.message_id)
        
#         # =====================================================================
#         # Step 13: Build LogResponse
#         # =====================================================================
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

#         # =====================================================================
#         # Step 14: Record metrics and return
#         # =====================================================================
#         elapsed_time = time.time() - start_time
#         monitoring_service.record_response_time(elapsed_time)
#         monitoring_service.intent_monitor.record_intent_classification(
#             intent=parsed_input.intent.value,
#             confidence=parsed_input.confidence,
#             response_time=elapsed_time
#         )
        
#         logger.info(f"Request completed in {elapsed_time:.3f}s")
#         logger.info(f"Returning LogResponse with intent: {parsed_input.intent.value}")
        
#         # Add metadata about clarification to response if needed
#         if needs_clarification:
#             logger.info("Response contains clarification request")
        
#         return log_response

#     except requests.Timeout:
#         response_time = time.time() - start_time
#         monitoring_service.record_response_time(response_time)
#         logger.error("Flask API request timed out")
#         raise HTTPException(
#             status_code=504, 
#             detail="Request timed out. Please try again."
#         )
#     except Exception as e:
#         response_time = time.time() - start_time
#         monitoring_service.record_response_time(response_time)
#         logger.exception("Intent detection failed")
#         raise HTTPException(
#             status_code=500, 
#             detail=f"Failed to detect intent: {str(e)}"
#         )


# def handle_clarification_response(
#     db: Session, 
#     session_id: UUID, 
#     clarification: str
# ) -> LogResponse:
#     """
#     Handle user's response to a clarification request.
#     This is a specialized version of detect_intent for clarification flow.
#     """
#     # Create a log request for the clarification
#     request = LogCreate(
#         session_id=session_id,
#         role="user",
#         content=clarification
#     )
    
#     # Process it - the detect_intent function will detect it's a clarification response
#     return detect_intent(db, request)
