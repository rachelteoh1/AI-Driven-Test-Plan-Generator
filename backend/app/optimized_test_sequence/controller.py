from typing import List
from fastapi import APIRouter, HTTPException, status
from starlette import status
from . import  models
from . import service
from ..database import DbSession
from uuid import UUID

router = APIRouter(
    prefix='/sequences',
    tags=['sequences']
)
#add new sequence, get new sequence

@router.post("/", response_model=models.SequenceResponse, status_code=status.HTTP_201_CREATED)
async def create_sequence(
    request: models.SequenceCreateRequest,
    db:DbSession,
):
    sequence = service.create_sequence_with_commands(db, request)
    # fetch commands to build response
    data = service.get_sequence_with_commands(db, sequence.sequence_id)
    if not data:
        raise HTTPException(status_code=404, detail="Sequence not found after creation")
    
    # Build response model including commands
    response = models.SequenceResponse(
        sequence_id=data["sequence"].sequence_id,
        message_id=data["sequence"].message_id,
        created_date=data["sequence"].created_date,
        commands=[
            models.ScpiCommandResponse(
                command_id=cmd.command_id,
                command_text=cmd.command_text,
                order_index=cmd.order_index,
            )
            for cmd in data["commands"]
        ],
    )
    return response

@router.post("/{sequence_id}/optimize", response_model=models.OptimizedSequenceResponse)
async def optimize_sequence(
    sequence_id: UUID,
    instrument: str,
    db: DbSession,
):
    result = service.optimize_sequence(db, sequence_id, instrument)
    sequence, commands, explanation = result

    return models.OptimizedSequenceResponse(
        sequence_id=sequence.sequence_id,
        message_id=sequence.message_id,
        created_date=sequence.created_date,
        # instrument=sequence.instrument,
        explanation=explanation.explanation_text,
        commands=[
            models.ScpiCommandResponse(
                command_id=cmd.command_id,
                command_text=cmd.command_text,
                order_index=cmd.order_index,
            ) for cmd in commands
        ]
    )

@router.get("/{sequence_id}", response_model=models.SequenceResponse)
async def read_sequence(
    sequence_id: UUID,
    db: DbSession,
):
    data = service.get_sequence_with_commands(db, sequence_id)
    if not data:
        raise HTTPException(status_code=404, detail="Sequence not found")
    
    response = models.SequenceResponse(
        sequence_id=data["sequence"].sequence_id,
        message_id=data["sequence"].message_id,
        created_date=data["sequence"].created_date,
        commands=[
            models.ScpiCommandResponse(
                command_id=cmd.command_id,
                command_text=cmd.command_text,
                order_index=cmd.order_index,
            )
            for cmd in data["commands"]
        ],
    )
    return response


