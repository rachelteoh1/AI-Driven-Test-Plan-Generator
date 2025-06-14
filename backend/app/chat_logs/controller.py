from typing import List
from fastapi import APIRouter
from starlette import status
from . import  models
from . import service
from ..database import DbSession
from uuid import UUID
from ..entities.entities import ChatLogVersion

router = APIRouter(
    prefix='/chatLog',
    tags=['chatLog']
)
#add new log,  get log, clear log

@router.post("/", response_model= models.LogResponse ,status_code=status.HTTP_201_CREATED)
async def add_new_chat_log(request: models.LogCreate , db: DbSession):
    return service.create_chat_log(db, request)



@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(session_id: UUID , db:DbSession):
    service.clear_chat_log(db, session_id)
    return

@router.get("/{session_id}", response_model=List[models.LogResponse])
async def get_chat_logs(session_id :UUID,db:DbSession):
    return service.get_chat_log_by_user(db, session_id)

@router.get("/versions/{message_id}", response_model=List[models.ChatLogVersionResponse])
async def get_chat_log_versions(message_id: UUID, db: DbSession):
    return service.get_chat_log_versions_with_replies(message_id,db)
    

@router.put("/modify", response_model=models.LogResponse)
async def modify_chat_log(request:  models.ModifyLog, db: DbSession):
    return service.modify_chat_log(db,request)

@router.post("/detect-intent", response_model = models.LogResponse)
async def detect_intent(request: models.LogCreate , db: DbSession):
    return service.detect_intent(db, request)


