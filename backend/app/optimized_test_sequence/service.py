
from ..entities.entities import OptimizedTestSequence, ScpiCommand
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