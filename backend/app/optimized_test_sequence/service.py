from typing import List, Tuple
from ..entities.entities import OptimizedTestSequence, ScpiCommand, OptimizationExplanation
from datetime import datetime
from uuid import UUID, uuid4
from fastapi import Depends
from sqlalchemy.orm import Session
import logging
from ..exceptions import (SequenceCreationError,SequenceError,SequenceNotFoundError,InternalServerError)
logger = logging.getLogger(__name__)

# add sequence , get sequence

def create_sequence_with_commands(db: Session, request):
    try:
        new_sequence = OptimizedTestSequence(
            sequence_id=uuid4(),
            message_id=request.message_id,
            created_date= datetime.utcnow()
        )
        db.add(new_sequence)
        db.flush()  # To get sequence_id before commit

        for cmd_req in request.commands:
            new_command = ScpiCommand(
                command_id=uuid4(),
                sequence_id=new_sequence.sequence_id,
                command_text=cmd_req.command_text,
                order_index=cmd_req.order_index
            )
            db.add(new_command)

        db.commit()
        db.refresh(new_sequence)
        logger.info(f"Created test sequence {new_sequence.sequence_id} with {len(request.commands)} commands")
        return new_sequence
    except Exception as e:
        logger.error(f"Failed to create test sequence: {str(e)}")
        raise SequenceCreationError(str(e))


def get_sequence_with_commands(db: Session, sequence_id: UUID):
    try:
        sequence = db.query(OptimizedTestSequence).filter_by(sequence_id=sequence_id).first()
        if not sequence:
            logger.warning(f"Test sequence not found: {sequence_id}")
            raise SequenceNotFoundError(sequence_id)

        commands = db.query(ScpiCommand).filter_by(sequence_id=sequence_id).order_by(ScpiCommand.order_index).all()

        logger.info(f"Retrieved sequence {sequence_id} with {len(commands)} commands")
        return {
            "sequence": sequence,
            "commands": commands
        }
    except Exception as e:
        logger.error(f"Failed to retrieve sequence {sequence_id}: {str(e)}")
        raise InternalServerError(str(e))
    
def optimize_sequence(db: Session, sequence_id: UUID, instrument: str) -> Tuple[OptimizedTestSequence, List[ScpiCommand], OptimizationExplanation]:
    try:
        # Step 1: Fetch original
        data = get_sequence_with_commands(db, sequence_id)
        original_commands = data["commands"]

        # Step 2: Apply optimization logic (you can replace this with LLM logic)
        optimized_commands = []
        seen = set()
        for cmd in original_commands:
            if cmd.command_text not in seen:
                seen.add(cmd.command_text)
                optimized_commands.append(cmd)

        # Step 3: Resequence
        for idx, cmd in enumerate(optimized_commands):
            cmd.order_index = idx

        # Step 4: Create new sequence entry
        new_sequence = OptimizedTestSequence(
            sequence_id=uuid4(),
            message_id=data["sequence"].message_id,
            created_date=datetime.utcnow(),
            # instrument=instrument
        )
        db.add(new_sequence)
        db.flush()

        # Step 5: Store optimized commands
        for cmd in optimized_commands:
            new_cmd = ScpiCommand(
                command_id=uuid4(),
                sequence_id=new_sequence.sequence_id,
                command_text=cmd.command_text,
                order_index=cmd.order_index,
            )
            db.add(new_cmd)

        # Step 6: Generate and store explanation
        explanation_text = f"{len(original_commands) - len(optimized_commands)} redundant commands removed."
        explanation = OptimizationExplanation(
            explanation_id=uuid4(),
            sequence_id=new_sequence.sequence_id,
            explanation_text=explanation_text,
        )
        db.add(explanation)

        db.commit()
        return new_sequence, optimized_commands, explanation

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to optimize sequence {sequence_id}: {str(e)}")
        raise InternalServerError(str(e))
