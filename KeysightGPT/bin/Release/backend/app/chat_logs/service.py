from datetime import timedelta, datetime, timezone
import time
from typing import Annotated
from uuid import UUID, uuid4
from fastapi import Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session
import re
import requests
import json
import logging

from ..chat_logs import monitoring_service
from ..entities.entities import ChatLog, ChatLogVersion, SelectedInstrument
from ..exceptions import (
    InternalServerError)
from .models import LogCreate, LogResponse, InstrumentResponse
from ..utils.intent_classifier import classify_intent_ml
from ..exceptions import ChatCreationError, ChatNotFoundError, ChatRenameError
from ..pdf_import.utils.suggest_intent import extract_scpi_from_pdf
from ..instrument import service
from ..optimized_test_sequence import service as opt_service
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from ..utils.nlp_utils import Intent, process_user_input, context_manager
from ..utils.intent_service import save_intent_metadata
logger = logging.getLogger(__name__)

# Initialize embedding model (loaded once at startup)
try:
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    print("Embedding model loaded successfully")
    logger.info("Embedding model loaded successfully")
except Exception as e:
    print(f"Failed to load embedding model: {str(e)}")
    logger.error(f"Failed to load embedding model: {str(e)}")
    embedding_model = None



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


def perform_semantic_search(commands_data, query, top_k=5):
    """
    Perform semantic search on SCPI commands using vector embeddings.
    Returns top-k commands ranked by cosine similarity.
    """
    if not commands_data or len(commands_data) == 0:
        logger.info("[RAG] No commands available for semantic search")
        return []
    
    logger.info(f"[RAG] Performing vector semantic search for: '{query}'")
    
    # Fallback to keyword search if embedding model not available
    if embedding_model is None:
        logger.warning("[RAG] Embedding model not available, using keyword fallback")
        return _keyword_search_fallback(commands_data, query, top_k)
    
    try:
        # Build text representations of commands (command + description)
        command_texts = []
        for cmd in commands_data:
            text = cmd.get('command', '')
            if cmd.get('description'):
                text += " " + cmd.get('description')
            command_texts.append(text)
        
        # Encode query and commands into embeddings
        logger.info(f"[RAG] Encoding query and {len(command_texts)} commands...")
        query_embedding = embedding_model.encode([query])
        command_embeddings = embedding_model.encode(command_texts)
        
        # Compute cosine similarity
        similarities = cosine_similarity(query_embedding, command_embeddings)[0]
        
        # Create scored commands with similarity scores
        scored_commands = []
        for idx, cmd in enumerate(commands_data):
            similarity = float(similarities[idx])
            if similarity > 0.1:  # Filter out very low similarity scores
                scored_commands.append({**cmd, 'score': similarity})
        
        # Sort by similarity and return top-k
        top_results = sorted(scored_commands, key=lambda x: x['score'], reverse=True)[:top_k]
        
        logger.info(f"[RAG] Found {len(top_results)} relevant commands: {[(r.get('command'), round(r.get('score'), 3)) for r in top_results]}")
        return top_results
        
    except Exception as e:
        logger.error(f"[RAG] Vector search failed: {str(e)}, falling back to keyword search")
        return _keyword_search_fallback(commands_data, query, top_k)


def _keyword_search_fallback(commands_data, query, top_k=5):
    """
    Fallback keyword-based search when vector embeddings are unavailable.
    """
    logger.info(f"[RAG] Using keyword search for: '{query}'")
    query_lower = query.lower()
    query_tokens = [t for t in query_lower.split() if len(t) > 2]
    
    scored_commands = []
    for cmd in commands_data:
        score = 0
        cmd_lower = cmd.get('command', '').lower()
        desc_lower = cmd.get('description', '').lower()
        params_lower = ' '.join(cmd.get('parameters', [])).lower()
        
        # Exact command match (highest priority)
        if cmd_lower == query_lower:
            score += 100
        
        # Command starts with query
        if cmd_lower.startswith(query_lower):
            score += 50
        
        # Query tokens in command, description, parameters
        for token in query_tokens:
            if token in cmd_lower:
                score += 10
            if token in desc_lower:
                score += 5
            if token in params_lower:
                score += 3
        
        # Boost for common measurement/configuration terms
        intent_keywords = ['measure', 'voltage', 'current', 'frequency', 'output', 'input', 
                          'configure', 'set', 'get', 'read', 'scan', 'route', 'display']
        for keyword in intent_keywords:
            if keyword in query_lower and (keyword in cmd_lower or keyword in desc_lower):
                score += 8
        
        if score > 0:
            scored_commands.append({**cmd, 'score': score})
    
    # Sort by score and return top-k
    top_results = sorted(scored_commands, key=lambda x: x['score'], reverse=True)[:top_k]
    
    logger.info(f"[RAG] Found {len(top_results)} relevant commands: {[(r.get('command'), r.get('score')) for r in top_results]}")
    return top_results


def extract_valid_commands_from_pdf(json_url_manual: str) -> set:
    """
    Fetch SCPI commands from the instrument's PDF JSON and return as a set.
    Returns empty set if URL is invalid or request fails.
    """
    if not json_url_manual:
        logger.warning("No JSON URL provided for PDF manual")
        return set()
    
    try:
        logger.info(f"[FILTER] Fetching valid commands from: {json_url_manual}")
        import requests as req
        json_response = req.get(json_url_manual, timeout=10)
        
        if json_response.status_code != 200:
            logger.warning(f"[FILTER] Failed to fetch SCPI commands: {json_response.status_code}")
            return set()
        
        scpi_data = json_response.json()
        
        # Extract command strings from the data
        valid_commands = set()
        if isinstance(scpi_data, list):
            for cmd_obj in scpi_data:
                if isinstance(cmd_obj, dict):
                    cmd = cmd_obj.get('command', '').strip()
                    if cmd:
                        # Normalize: remove extra spaces, handle both formats
                        normalized_cmd = re.sub(r'\s+', ' ', cmd.upper())
                        valid_commands.add(normalized_cmd)
        
        logger.info(f"[FILTER] Loaded {len(valid_commands)} valid commands from PDF manual")
        return valid_commands
        
    except Exception as e:
        logger.error(f"[FILTER] Error fetching PDF commands: {str(e)}")
        return set()


def filter_optimized_sequence(opt_sequence: str, valid_commands: set) -> tuple:
    """
    Filter the optimized sequence by:
    1. Removing all commands after :SYSTem:ERRor?
    2. Removing commands that are not in the valid_commands set (from PDF manual)
    3. Preserving overall structure and formatting
    
    Returns a tuple of (cleaned_sequence, explanation_text, removed_commands_list)
    """
    if not opt_sequence or not opt_sequence.strip():
        logger.info("[FILTER] Empty optimized sequence provided")
        return "", "", []
    
    logger.info(f"[FILTER] Starting sequence filtering with {len(valid_commands)} valid commands")
    
    # Step 1: Remove everything after :SYSTem:ERRor? (but keep the error command itself)
    lines = opt_sequence.split('\n')
    filtered_lines = []
    error_command_found = False
    
    for line in lines:
        # Check if this line contains the error command
        if ':SYSTEM:ERROR?' in line.upper() or ':SYSTem:ERRor?' in line:
            error_command_found = True
            filtered_lines.append(line)  # Keep the :SYSTem:ERRor? command itself
            logger.info("[FILTER] Found :SYSTem:ERRor? command - keeping it and removing all subsequent commands")
            break
        filtered_lines.append(line)
    
    # Step 2: If no valid commands set provided, return the truncated sequence
    if not valid_commands:
        logger.warning("[FILTER] No valid commands to validate against, returning truncated sequence")
        result = '\n'.join(filtered_lines).strip()
        explanation = "\n\nRemoved unnecessary commands."
        return result, explanation, []
    
    # Step 3: Filter out commands not in the PDF manual
    validated_lines = []
    removed_commands = []
    commands_removed = 0
    
    for line in filtered_lines:
        stripped_line = line.strip()
        
        # Skip empty lines and non-command content
        if not stripped_line or stripped_line.startswith('#') or stripped_line.startswith('//'):
            validated_lines.append(line)
            continue
        
        # Always keep :SYSTem:ERRor? command regardless of PDF validation
        if ':SYSTEM:ERROR?' in stripped_line.upper() or ':SYSTem:ERRor?' in stripped_line:
            validated_lines.append(line)
            logger.debug(f"[FILTER] Keeping :SYSTem:ERRor? command (no validation)")
            continue
        
        # Skip :SYSTem:HEADer OFF command
        if ':SYSTEM:HEADER OFF' in stripped_line.upper():
            commands_removed += 1
            removed_commands.append(stripped_line)
            logger.info(f"[FILTER] Removing :SYSTem:HEADer OFF command")
            continue
        
        # Extract command part (before space) and normalize
        command_part = stripped_line.split()[0].upper() if stripped_line.split() else stripped_line.upper()
        # Remove leading : for comparison
        command_to_check = command_part.lstrip(':')
        
        # Helper function to normalize command by removing numbers, |, and {}
        def normalize_command(cmd):
            # Remove curly braces, pipes, and numbers
            normalized = re.sub(r'[{}|0-9]', '', cmd)
            return normalized
        
        # Check if command exists in valid set (also check without leading :)
        is_valid = False
        if valid_commands:
            normalized_to_check = normalize_command(command_to_check)
            for valid_cmd in valid_commands:
                valid_cmd_normalized = normalize_command(valid_cmd.lstrip(':'))
                
                # Check for exact match or prefix match (after normalization)
                if normalized_to_check == valid_cmd_normalized or normalized_to_check.startswith(valid_cmd_normalized + ':'):
                    is_valid = True
                    break
        else:
            # If no valid commands set, keep the line
            is_valid = True
        
        if is_valid:
            validated_lines.append(line)
            logger.debug(f"[FILTER] Command valid: {command_to_check}")
        else:
            commands_removed += 1
            removed_commands.append(stripped_line)
            logger.info(f"[FILTER] Removing invalid command: {command_to_check}")
    
    result = '\n'.join(validated_lines).strip()
    
    # Build explanation of removed commands
    explanation = ""
    if removed_commands:
        explanation = "\n\nRemoved unnecessary commands."
    
    logger.info(f"[FILTER] Removed {commands_removed} invalid commands. Sequence reduced from {len(opt_sequence)} to {len(result)} characters")
    
    return result, explanation, removed_commands


def detect_intent(db: Session, request: LogCreate) -> LogResponse:
    """
    Detect user intent and generate AI response with enhanced NLP preprocessing,
    RAG semantic search, and clarification handling.
    
    Now properly handles:
    - Multiple questions in one session
    - Clarification flow with context preservation
    - New query detection (user ignores clarification)
    - Off-topic conversation
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
            instrument_prefix = f"Keysight {selected_instrument.model}: "
            logger.info(f"Selected instrument: {instrument_context}")
        else:
            selected_instrument = None
            instrument_context = "Generic SCPI Instrument"
            instrument_model = None
            instrument_prefix = ""
            logger.warning("No instrument selected for session")

        # =====================================================================
        # Step 2: Enhanced NLP Preprocessing
        # =====================================================================
        user_input = request.content.strip()
        
        # Use session_id for context tracking (THIS IS THE KEY!)
        # This allows the system to remember clarification state
        result = process_user_input(user_input, session_id=str(request.session_id))
        
        logger.info(
            "\n"
            "┌───────────────────────── PREPROCESSING RESULT ─────────────────────┐\n"
            "│ Raw User Input        │ %-45s │\n"
            "│ Action                │ %-45s │\n"
            "│ Send to LLM           │ %-45s │\n"
            "└────────────────────────────────────────────────────────────────────┘",
            user_input[:45],
            result['action'],
            result['send_to_llm']
        )

        # =====================================================================
        # Step 3: Handle different preprocessing outcomes
        # =====================================================================
        
        # Case 1: OFF_TOPIC - respond directly without LLM
        if result['action'] == 'respond_directly':
            logger.info("Handling off-topic conversation")
            
            # Save user message
            # user_log = create_chat_log(db, request)
            
            # Save bot response
            bot_response = result['response']
            bot_log = LogCreate(
                session_id=request.session_id,
                role="llm_response",
                content=bot_response
            )
            saved_log = create_chat_log(db, bot_log)
            
            return LogResponse(
                message_id=saved_log.message_id,
                session_id=saved_log.session_id,
                role=saved_log.role,
                content=saved_log.content,
                timestamp=saved_log.timestamp,
                has_been_modified=False,
                has_optimization=False,
                selected_instrument=InstrumentResponse(
                    manufacturer=selected_instrument.manufacturer,
                    model=selected_instrument.model,
                    serial=selected_instrument.serial,
                ) if selected_instrument else None,
            )
        
        # Case 2: UNCLEAR - ask for clarification
        elif result['action'] == 'ask_clarification':
            logger.info("User input unclear, requesting clarification")
            
            # # Save user message
            # user_log = create_chat_log(db, request)
            
            # Save clarification question with special marker
            clarification_question = f"[CLARIFICATION_NEEDED]\n\n{result['question']}"
            bot_log = LogCreate(
                session_id=request.session_id,
                role="llm_response",
                content=clarification_question
            )
            saved_log = create_chat_log(db, bot_log)
            
            # Save context metadata (optional - for debugging)
            try:
                save_intent_metadata(
                    db=db,
                    message_id=saved_log.message_id,
                    intent="unclear",
                    confidence=0.0,
                    scpi_commands=[],
                    measurement_types=[],
                    conditions=[],
                    targets=[]
                )
            except Exception as e:
                logger.warning(f"Failed to save intent metadata: {str(e)}")
            
            return LogResponse(
                message_id=saved_log.message_id,
                session_id=saved_log.session_id,
                role=saved_log.role,
                content=saved_log.content,
                timestamp=saved_log.timestamp,
                has_been_modified=False,
                has_optimization=False,
                selected_instrument=InstrumentResponse(
                    manufacturer=selected_instrument.manufacturer,
                    model=selected_instrument.model,
                    serial=selected_instrument.serial,
                ) if selected_instrument else None,
            )
        
        # Case 3: CLARIFICATION_FAILED - too many attempts
        elif result['action'] == 'clarification_failed':
            logger.warning("Clarification loop failed after multiple attempts")
            
            # Save user message
            # user_log = create_chat_log(db, request)
            
            # Save failure response
            bot_log = LogCreate(
                session_id=request.session_id,
                role="llm_response",
                content=result['response']
            )
            saved_log = create_chat_log(db, bot_log)
            
            return LogResponse(
                message_id=saved_log.message_id,
                session_id=saved_log.session_id,
                role=saved_log.role,
                content=saved_log.content,
                timestamp=saved_log.timestamp,
                has_been_modified=False,
                has_optimization=False,
                selected_instrument=InstrumentResponse(
                    manufacturer=selected_instrument.manufacturer,
                    model=selected_instrument.model,
                    serial=selected_instrument.serial,
                ) if selected_instrument else None,
            )
        
        # Case 4: PROCESS_WITH_LLM - continue to LLM
        elif result['action'] == 'process_with_llm':
            logger.info("Processing with LLM")
            
            # Extract parsed data
            parsed_input = result['parsed_data']
            
            # If this was a combined query (from clarification), use the combined text
            actual_user_input = result.get('combined_query', user_input)
            
            logger.info(
                "\n"
                "┌───────────────────────── NLP PARSE RESULT ─────────────────────────┐\n"
                "│ Original Input        │ %-45s │\n"
                "│ Final Input           │ %-45s │\n"
                "│ Intent Detected       │ %-45s │\n"
                "│ Confidence            │ %-45s │\n"
                "│ Intent Reasoning      │ %-45s │\n"
                "│ SCPI Commands         │ %-45s │\n"
                "│ Measurement Types     │ %-45s │\n"
                "│ Conditions            │ %-45s │\n"
                "│ Targets               │ %-45s │\n"
                "└─────────────────────────────────────────────────────────────────────┘",
                user_input[:45],
                actual_user_input[:45],
                parsed_input['intent'],
                f"{parsed_input['confidence']:.2f}",
                parsed_input.get('intent_reasoning', 'N/A')[:45],
                ", ".join(parsed_input['scpi_commands'])[:45] or "None",
                ", ".join(parsed_input['measurement_types'])[:45] or "None",
                ", ".join(parsed_input['conditions'])[:45] or "None",
                ", ".join(parsed_input['targets'])[:45] or "None",
            )

        # =====================================================================
        # Step 4: Perform RAG Semantic Search on SCPI Commands
        # =====================================================================
        rag_context_text = ""
        if selected_instrument and selected_instrument.json_url_manual:
            try:
                # Fetch SCPI commands from instrument JSON
                logger.info(f"Fetching SCPI commands from: {selected_instrument.json_url_manual}")
                import requests as req
                json_response = req.get(selected_instrument.json_url_manual, timeout=10)
                
                if json_response.status_code == 200:
                    scpi_data = json_response.json()
                    
                    # Expecting flat array of SCPI commands
                    if not isinstance(scpi_data, list):
                        logger.warning(f"Expected list of commands, got {type(scpi_data)}")
                        scpi_data = []
                    
                    logger.info(f"Loaded {len(scpi_data)} SCPI commands")
                    
                    # Perform semantic search
                    relevant_commands = perform_semantic_search(scpi_data, user_input, top_k=5)
                    
                    # Build RAG context text
                    if relevant_commands:
                        rag_context_text = "\n\nRelevant SCPI Commands from Documentation:\n"
                        for idx, cmd_data in enumerate(relevant_commands, 1):
                            cmd_info = f"{idx}. {cmd_data.get('command', '')}"
                            if cmd_data.get('description'):
                                cmd_info += f" - {cmd_data.get('description')}"
                            if cmd_data.get('parameters'):
                                params = cmd_data.get('parameters', [])
                                if isinstance(params, list):
                                    cmd_info += f"\n   Parameters: {', '.join(params)}"
                            if cmd_data.get('values'):
                                cmd_info += f"\n   Values: {cmd_data.get('values', '')}"
                            if cmd_data.get('page'):
                                cmd_info += f" (Page {cmd_data.get('page')})"
                            rag_context_text += cmd_info + "\n"
                        logger.info(f"RAG context built with {len(relevant_commands)} commands")
                else:
                    logger.warning(f"Failed to fetch SCPI JSON: {json_response.status_code}")
            except Exception as e:
                logger.error(f"Error performing semantic search: {str(e)}")

        # =====================================================================
        # Step 5: Construct enhanced user message with RAG context
        # =====================================================================
        user_msg = f"{instrument_prefix}{actual_user_input}"
        enhanced_prompt = user_msg + rag_context_text
        logger.info(f"Constructed user message: {user_msg}")
        logger.info(f"Enhanced prompt with RAG: {enhanced_prompt[:200]}...")

        # =====================================================================
        # Step 6: Build metadata payload for Flask API
        # =====================================================================
        metadata = {
            "intent": parsed_input['intent'],
            "confidence": float(parsed_input['confidence']),
            "scpi_commands": parsed_input['scpi_commands'],
            "measurement_types": parsed_input['measurement_types'],
            "conditions": parsed_input['conditions'],
            "targets": parsed_input['targets'],
            "equipment_refs": parsed_input['equipment_refs'],
            "action_verbs": parsed_input['action_verbs'],
            "temporal_info": parsed_input['temporal_info'],
            "instrument_model": instrument_model,
            "original_text": user_input,
            "combined_query": result.get('combined_query')  # Include if clarification was combined
        }
        
        # =====================================================================
        # Step 7: Determine routing parameters based on intent
        # =====================================================================
        intent_routing = {
            "generate_test": {
                "temperature": 0.3,
                "max_tokens": 256
            },
            "explain_command": {
                "temperature": 0.2,
                "max_tokens": 256
            },
            "modify_sequence": {
                "temperature": 0.3,
                "max_tokens": 256
            },
            "troubleshoot": {
                "temperature": 0.2,
                "max_tokens": 256
            },
            "query_capability": {
                "temperature": 0.2,
                "max_tokens": 200
            },
            "unclear": {
                "temperature": 0.3,
                "max_tokens": 256
            }
        }
        
        routing_params = intent_routing.get(
            parsed_input['intent'], 
            intent_routing["unclear"]
        )
        
        # =====================================================================
        # Step 8: Send request to Flask API
        # =====================================================================
        payload = {
            "prompt": enhanced_prompt,
            "session_id": str(request.session_id), 
            "max_tokens": routing_params["max_tokens"],
            "temperature": routing_params["temperature"],
            "metadata": metadata,
            
        }
        
        logger.info(f"Sending to Flask API with intent: {parsed_input['intent']}")
        
        response = requests.post(MISTRAL_API_URL, json=payload, timeout=(5, 120))

        if response.status_code != 200:
            logger.error(f"Flask API Error: {response.text}")
            raise Exception(f"Flask API returned {response.status_code}")

        data = response.json()
        logger.info(f"Flask API response: {json.dumps(data, indent=2)}")
        
        # =====================================================================
        # Step 9: Extract response from Flask (now returns separate fields)
        # =====================================================================
        gen_response = data.get("gen_response", "")
        opt_sequence = data.get("opt_sequence", "")
        explanation = data.get("explanation", "")
        is_explanation = data.get("is_explanation", False)
        
        if not gen_response:
            raise Exception("Flask API returned empty gen_response")

        logger.info(f"Gen response length: {len(gen_response)}")
        logger.info(f"Is explanation: {is_explanation}")
        logger.info(f"Optimized sequence: {opt_sequence}")

        # =====================================================================
        # Step 10: Filter optimized sequence BEFORE saving chat logs
        # =====================================================================
        filtered_sequence = opt_sequence
        filter_explanation = ""
        removed_commands = []
        
        # Only filter if we have an optimization and it's not an explanation
        if (not is_explanation and opt_sequence and opt_sequence.strip() and
            parsed_input['intent'] in ['generate_test', 'modify_sequence']):
            
            if selected_instrument and selected_instrument.json_url_manual:
                # Get valid commands from the PDF manual
                valid_commands = extract_valid_commands_from_pdf(
                    selected_instrument.json_url_manual
                )
                
                # Filter the sequence
                if valid_commands:
                    filtered_sequence, filter_explanation, removed_commands = filter_optimized_sequence(
                        opt_sequence,
                        valid_commands
                    )
                    logger.info(
                        f"[FILTER] Sequence filtering completed. "
                        f"Original: {len(opt_sequence)} chars, "
                        f"Filtered: {len(filtered_sequence)} chars, "
                        f"Removed: {len(removed_commands)} commands"
                    )
                else:
                    # If we couldn't get valid commands, still remove :SYSTem:ERRor? part
                    filtered_sequence, filter_explanation, removed_commands = filter_optimized_sequence(opt_sequence, set())
                    logger.warning(
                        "[FILTER] Could not validate against PDF manual, "
                        "removing :SYSTem:ERRor? section only"
                    )
            else:
                # No instrument or JSON URL, still filter for :SYSTem:ERRor?
                filtered_sequence, filter_explanation, removed_commands = filter_optimized_sequence(opt_sequence, set())
                logger.info("[FILTER] No instrument manual available, removing :SYSTem:ERRor? section only")
        
        # Build formatted output with all components
        formatted_output = gen_response
        if not is_explanation and opt_sequence:
            formatted_output += f"\n\nOptimized Sequence:\n{filtered_sequence}"
            
            # If explanation is "Already Optimized" and filter_explanation exists, replace it
            if filter_explanation and explanation.strip() == "Already optimized.":
                formatted_output += f"\n\nExplanation: \n{filter_explanation.strip()}"
            else:
                formatted_output += f"\n\nExplanation: \n{explanation}"
                if filter_explanation:
                    formatted_output += f"\n{filter_explanation.strip()}"

        # =====================================================================
        # Step 11: Save chat logs (user message + bot response)
        # =====================================================================
        # Save user message
        # user_log = create_chat_log(db, request)
        
        # Save bot response with the complete formatted output
        bot_log = LogCreate(
            session_id=request.session_id,
            role="llm_response",
            content=formatted_output,
        )
        saved_log = create_chat_log(db, bot_log)
        
        # Save intent metadata
        try:
            save_intent_metadata(
                db=db,
                message_id=saved_log.message_id,
                intent=parsed_input['intent'],
                confidence=parsed_input['confidence'],
                scpi_commands=parsed_input['scpi_commands'],
                measurement_types=parsed_input['measurement_types'],
                conditions=parsed_input['conditions'],
                targets=parsed_input['targets']
            )
        except Exception as e:
            logger.warning(f"Failed to save intent metadata: {str(e)}")

        # =====================================================================
        # Step 12: Save optimized sequence (only if appropriate)
        # =====================================================================
        should_save_optimization = (
            not is_explanation and 
            opt_sequence and 
            opt_sequence.strip() and
            parsed_input['intent'] in ['generate_test', 'modify_sequence']
        )
        
        if should_save_optimization:
            try:
                # Save the filtered sequence (already filtered in Step 10)
                opt_service.save_optimized_sequence(db, saved_log.message_id, filtered_sequence)
                logger.info(f"Saved filtered optimized sequence for message {saved_log.message_id}")
            except Exception as e:
                logger.exception(f"Failed to save optimized sequence: {str(e)}")
        else:
            logger.info(f"Skipping optimization save - conditions not met")

        has_optimization = opt_service.has_optimized_sequence(db, saved_log.message_id)
        
        # =====================================================================
        # Step 12: Build LogResponse
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
        # Step 13: Record metrics and return
        # =====================================================================
        elapsed_time = time.time() - start_time
        monitoring_service.record_response_time(elapsed_time)
        monitoring_service.intent_monitor.record_intent_classification(
            intent=parsed_input['intent'],
            confidence=parsed_input['confidence'],
            response_time=elapsed_time
        )
        logger.info(
        "\n"
        "┌───────────────────────── PREPROCESSING RESULT ─────────────────────┐\n"
        "│ Request completed in        │ %-45.3f │s\n"
        "└────────────────────────────────────────────────────────────────────┘",
        elapsed_time
)

        logger.info(f"Request completed in {elapsed_time:.3f}s")
        logger.info(f"Returning LogResponse with intent: {parsed_input['intent']}")
        
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


# ============================================================================
# OPTIONAL: Explicit session management endpoints
# ============================================================================

def reset_session_context(session_id: UUID):
    """
    Explicitly reset clarification context for a session.
    Call this when user clicks "New Chat" or "Reset" button.
    """
    session_id_str = str(session_id)
    if session_id_str in context_manager.contexts:
        context_manager.contexts[session_id_str].reset()
        logger.info(f"Reset context for session {session_id}")
    return {"status": "success", "message": "Session context reset"}

def get_session_context_status(session_id: UUID) -> dict:
    """
    Get current context status for debugging.
    """
    session_id_str = str(session_id)
    ctx = context_manager.get_context(session_id_str)
    
    return {
        "session_id": session_id_str,
        "awaiting_clarification": ctx.awaiting_clarification,
        "clarification_count": ctx.clarification_count,
        "original_query": ctx.original_query,
        "last_interaction": ctx.last_interaction.isoformat() if ctx.last_interaction else None
    }
    
