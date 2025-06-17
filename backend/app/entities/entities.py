from sqlalchemy import Column, String, Text,  DateTime, ForeignKey,Integer, Boolean, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from ..database import Base 
from datetime import datetime,timezone

#define table's attribute
class User(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    
    username = Column(String, nullable=True)
    role = Column(String, default="user")
    date_joined = Column(DateTime, default=datetime.now(timezone.utc))
    pref_darkmode = Column(Boolean, default=False)
    pref_autosave = Column(Boolean, default=True)

    def __repr__(self):
        return f"<User(email='{self.email}')>"
    
class ChatSession(Base):
    __tablename__="chat_sessions"

    session_id= Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id= Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False) 
    title= Column(Text)
    created_at= Column(DateTime, default=datetime.now(timezone.utc))
    updated_at= Column(DateTime, default=datetime.now(timezone.utc))
    
   
class ChatLog(Base):
    __tablename__ = "chat_logs"

    message_id = Column(UUID, primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID, ForeignKey("chat_sessions.session_id"), nullable=False)
    parent_id = Column(UUID, ForeignKey("chat_logs.message_id"), nullable=True)
    version_of = Column(UUID, ForeignKey("chat_log_versions.version_id"), nullable=True)
    role = Column(String)
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)
    has_been_modified = Column(Boolean, default=False)
    updated_at  = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
   

class ChatLogVersion(Base):
    __tablename__ = "chat_log_versions"
    version_id = Column(UUID, primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID, ForeignKey("chat_logs.message_id"))
    session_id = Column(UUID, ForeignKey("chat_sessions.session_id"))
    old_content = Column(Text)
    edited_at = Column(DateTime, default=datetime.now(timezone.utc))

   


class OptimizedTestSequence(Base):
    __tablename__ = "optimized_test_sequence"

    sequence_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_logs.message_id"), nullable=False)
    created_date = Column(DateTime, default=datetime.now(timezone.utc))


class ScpiCommand(Base):
    __tablename__="scpi_command"

    command_id =Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sequence_id = Column(UUID(as_uuid=True), ForeignKey("optimized_test_sequence.sequence_id"), nullable=False)
    command_text= Column(Text)
    order_index = Column(Integer)
    
class OptimizationExplanation(Base):
    __tablename__ = "optimization_explanation"

    explanation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sequence_id = Column(UUID(as_uuid=True), ForeignKey("optimized_test_sequence.sequence_id"), nullable=False)
    explanation_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))


class Dashboard(Base):
    __tablename__ = "dashboard"

    dashboard_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    total_test_plans = Column(Integer, default=0)
    total_commands_generated = Column(Integer, default=0)
    total_minutes_saved = Column(Integer, default=0)
    most_used_device = Column(String)
    month = Column(Date)



