from typing import List
from fastapi import APIRouter, HTTPException, status
from . import models
from . import service
from ..database import DbSession
from uuid import UUID

router = APIRouter(
    prefix='/optimized-sequences',
    tags=['optimized-sequences']
)

@router.post("/", response_model=List[models.OptimizedScpiResponse], status_code=status.HTTP_201_CREATED)
async def create_optimized_sequence(
    request: models.BulkOptimizedScpiCreateRequest,
    db: DbSession,
):
    # Combine commands into text format for parsing
    optimized_text = "\n".join(request.scpi_commands)
    
    sequences = service.save_optimized_sequence(db, request.message_id, optimized_text)
    
    return [
        models.OptimizedScpiResponse(
            id=seq.id,
            message_id=seq.message_id,
            optimized_scpi=seq.optimized_scpi,
            order_sequence=seq.order_sequence,
            type=seq.type,
            created_at=seq.created_at
        )
        for seq in sequences
    ]


@router.get("/{message_id}", response_model=models.OptimizedSequenceListResponse)
async def get_optimized_sequence(
    message_id: UUID,
    db: DbSession,
):
    """Get optimized SCPI sequence for a message."""
    sequences = service.get_optimized_sequence(db, message_id)
    
    if not sequences:
        raise HTTPException(status_code=404, detail="No optimized sequence found for this message")
    
    return models.OptimizedSequenceListResponse(
        message_id=message_id,
        commands=[
            models.OptimizedScpiResponse(
                id=seq.id,
                message_id=seq.message_id,
                optimized_scpi=seq.optimized_scpi,
                order_sequence=seq.order_sequence,
                type=seq.type,
                created_at=seq.created_at
            )
            for seq in sequences
        ]
    )


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_optimized_sequence(
    message_id: UUID,
    db: DbSession,
):
    """Delete optimized SCPI sequence for a message."""
    deleted_count = service.delete_optimized_sequence(db, message_id)
    
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="No optimized sequence found for this message")
    
    return None