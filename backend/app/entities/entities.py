from sqlalchemy import Column, String, Text,  DateTime, ForeignKey,Integer,Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from ..database import Base 
from datetime import datetime

#define table's attribute
class User(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)

    def __repr__(self):
        return f"<User(email='{self.email}')>"
    
class ChatSession(Base):
    __tablename__="chat_sessions"

    session_id= Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id= Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False) 
    title= Column(Text)
    created_at= Column(DateTime, default=datetime.utcnow)
    updated_at= Column(DateTime, default=datetime.utcnow)
    
   
class ChatLog(Base):
    __tablename__ = "chat_logs"

    message_id = Column(UUID, primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID, ForeignKey("chat_sessions.session_id"), nullable=False)
    parent_id = Column(UUID, ForeignKey("chat_logs.message_id"), nullable=True)
    version_of = Column(UUID, ForeignKey("chat_log_versions.version_id"), nullable=True)
    role = Column(String)
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    has_been_modified = Column(Boolean, default=False)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
   

class ChatLogVersion(Base):
    __tablename__ = "chat_log_versions"
    version_id = Column(UUID, primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID, ForeignKey("chat_logs.message_id"))
    session_id = Column(UUID, ForeignKey("chat_sessions.session_id"))
    old_content = Column(Text)
    edited_at = Column(DateTime, default=datetime.utcnow)

   


class OptimizedTestSequence(Base):
    __tablename__  = "optimized_test_sequence"

    sequence_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_logs.message_id"), nullable=False)  # FK to ChatLog
    created_date = Column(DateTime, default=datetime.utcnow)

class ScpiCommand(Base):
    __tablename__="scpi_command"

    command_id =Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sequence_id = Column(UUID(as_uuid=True), ForeignKey("optimized_test_sequence.sequence_id"), nullable=False)
    command_text= Column(Text)
    order_index = Column(Integer)



