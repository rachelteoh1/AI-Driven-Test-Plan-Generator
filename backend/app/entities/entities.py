from sqlalchemy import Column, String, Text,  DateTime, ForeignKey,Integer, Boolean, Date
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..database import Base 
from datetime import datetime

#define table's attribute
class User(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    
    username = Column(String, nullable=True)
    role = Column(String, default="user")
    date_joined = Column(DateTime, default=datetime.utcnow)
    pref_darkmode = Column(Boolean, default=False)
    pref_autosave = Column(Boolean, default=True)

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
    __tablename__ = "chat_logs"  #name table
   
    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.session_id"), nullable=False)  # FK to ChatSession
    role=Column(Text)
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

# class Examples(Base):
#     __tablename__ = "examples"


class OptimizedTestSequence(Base):
    __tablename__ = "optimized_test_sequence"

    sequence_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_logs.message_id"), nullable=False) # FK to chatlog
    created_date = Column(DateTime, default=datetime.utcnow)

    # is_optimized = Column(Boolean, default=False)
    # optimization_explanation = Column(Text, nullable=True)


class ScpiCommand(Base):
    __tablename__="scpi_command"

    command_id =Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sequence_id = Column(UUID(as_uuid=True), ForeignKey("optimized_test_sequence.sequence_id"), nullable=False)
    command_text= Column(Text)
    order_index = Column(Integer)

class Dashboard(Base):
    __tablename__ = "dashboard"

    dashboard_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    total_test_plans = Column(Integer, default=0)
    total_commands_generated = Column(Integer, default=0)
    total_minutes_saved = Column(Integer, default=0)
    most_used_device = Column(String)
    month = Column(Date)



