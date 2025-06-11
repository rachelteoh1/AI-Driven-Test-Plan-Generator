from typing import List
from fastapi import APIRouter
from starlette import status
from . import  models
from . import service
from ..database import DbSession
from uuid import UUID

router = APIRouter(
    prefix='/chatLog',
    tags=['chatLog']
)
#add new log,  get log, clear log

@router.post("/", response_model= models.LogResponse ,status_code=status.HTTP_201_CREATED)
async def add_new_chat(request: models.LogCreate , db: DbSession):
    service.create_chatlog(db, request)



@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(session_id: UUID , db:DbSession):
    service.clear_chat_log(db, session_id)
    return

@router.get("/{session_id}", response_model=List[models.LogResponse])
async def get_chat_logs(session_id :UUID,db:DbSession):
    return service.get_chat_log_by_user(db, session_id)


@router.post("/detect-intent", response_model = models.LogResponse)
async def detect_intent(request: models.LogCreate , db: DbSession):
    service.detect_intent(db, request)


