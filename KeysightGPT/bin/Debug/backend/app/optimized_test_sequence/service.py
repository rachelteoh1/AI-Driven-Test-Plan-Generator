from typing import List
from ..entities.entities import OptimizedTestSequence
from datetime import datetime, timezone
from uuid import UUID, uuid4
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


def determine_scpi_type(scpi_command: str) -> str:
    return 'query' if scpi_command.strip().endswith('?') else 'command'


def parse_optimized_sequence(optimized_text: str) -> List[str]:
    lines = optimized_text.strip().split('\n')
    commands = []
    
    for line in lines:
        line = line.strip()
        # Skip empty lines and headers
        if not line or line.startswith('**') or line.lower().startswith('optimized'):
            continue
        # Remove numbering like "1. ", "2. ", etc.
        if line and line[0].isdigit() and '.' in line[:3]:
            line = line.split('.', 1)[1].strip()
        
        if line:
            commands.append(line)
    
    return commands


def save_optimized_sequence(db: Session, message_id: UUID, optimized_text: str) -> List[OptimizedTestSequence]:
    try:
        # Parse commands from text
        scpi_commands = parse_optimized_sequence(optimized_text)
        
        if not scpi_commands:
            logger.warning(f"No SCPI commands found in optimized text for message {message_id}")
            return []
        
        # Create database records
        saved_sequences = []
        for idx, scpi in enumerate(scpi_commands):
            scpi_type = determine_scpi_type(scpi)
            
            sequence = OptimizedTestSequence(
                id=uuid4(),
                message_id=message_id,
                optimized_scpi=scpi,
                order_sequence=idx,
                type=scpi_type,
                created_at=datetime.now(timezone.utc)
            )
            
            db.add(sequence)
            saved_sequences.append(sequence)
            
            logger.info(f"Added: message_id={message_id}, scpi={scpi}, order={idx}, type={scpi_type}")
        
        db.commit()
        
        logger.info(f"Saved {len(saved_sequences)} optimized SCPI commands for message {message_id}")
        return saved_sequences
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save optimized sequence for message {message_id}: {str(e)}")
        raise


def get_optimized_sequence(db: Session, message_id: UUID) -> List[OptimizedTestSequence]:
    try:
        sequences = db.query(OptimizedTestSequence).filter_by(
            message_id=message_id
        ).order_by(OptimizedTestSequence.order_sequence).all()
        
        logger.info(f"Retrieved {len(sequences)} optimized commands for message {message_id}")
        return sequences
        
    except Exception as e:
        logger.error(f"Failed to retrieve optimized sequence for message {message_id}: {str(e)}")
        raise


def delete_optimized_sequence(db: Session, message_id: UUID) -> int:
    try:
        deleted_count = db.query(OptimizedTestSequence).filter_by(
            message_id=message_id
        ).delete()
        
        db.commit()
        logger.info(f"Deleted {deleted_count} optimized commands for message {message_id}")
        return deleted_count
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete optimized sequence for message {message_id}: {str(e)}")
        raise
    
def has_optimized_sequence(db: Session, message_id: UUID) -> bool:
    try:
        exists = db.query(OptimizedTestSequence).filter_by(
            message_id=message_id
        ).first() is not None
        
        return exists
        
    except Exception as e:
        logger.error(f"Failed to check optimized sequence for message {message_id}: {str(e)}")
        return False