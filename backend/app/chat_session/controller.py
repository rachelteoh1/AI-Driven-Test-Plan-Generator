from typing import List
from fastapi import APIRouter, HTTPException
from starlette import status
from . import models, service
from ..database import DbSession
from uuid import UUID
import logging

router = APIRouter(
    prefix='/chatSession',
    tags=['chatSession']
)

# POST: Add new chat session
@router.post("/", response_model=models.ChatResponse, status_code=status.HTTP_201_CREATED)
async def add_new_chat(request: models.ChatCreateRequest, db: DbSession):
    return service.create_chat(db, request)
   

# PUT: Rename existing chat session
@router.put("/rename", response_model=models.ChatResponse)
async def rename_chat(request: models.ChatRenameRequest, db: DbSession):
    return service.rename_chat(db, request)

   
       

# DELETE: Delete a chat session by session_id
@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(session_id: UUID, db: DbSession):
    service.delete_chat(db, session_id)
    return
   

# GET: Retrieve all chat sessions for a specific user
@router.get("/user/{user_id}", response_model=List[models.ChatResponse])
async def get_user_chats(user_id: UUID, db: DbSession):
   return service.get_chat_by_user(db, user_id)
        