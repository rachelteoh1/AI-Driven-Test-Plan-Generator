from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Boolean, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, backref
import uuid
from ..database import Base 
from datetime import datetime,timezone

# -------------------------------
# User Model
# -------------------------------
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

    chat_sessions = relationship("ChatSession", cascade="all, delete-orphan", backref="user")
    dashboard_entries = relationship("Dashboard", cascade="all, delete-orphan", backref="user")

# -------------------------------
# ChatSession Model
# -------------------------------
class ChatSession(Base):
    __tablename__ = "chat_sessions"

    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc))
    login_session_id = Column(UUID(as_uuid=True), nullable=True)  # track session
    
    chat_logs = relationship("ChatLog", cascade="all, delete-orphan", backref="session")
    log_versions = relationship("ChatLogVersion", cascade="all, delete-orphan", backref="session")

# -------------------------------
# ChatLog Model
# -------------------------------
class ChatLog(Base):
    __tablename__ = "chat_logs"

    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.session_id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("chat_logs.message_id", ondelete="CASCADE"), nullable=True)
    version_of = Column(UUID(as_uuid=True), ForeignKey("chat_log_versions.version_id", ondelete="SET NULL"), nullable=True)

    role = Column(String)
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)
    has_been_modified = Column(Boolean, default=False)
    updated_at  = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
   

    children = relationship("ChatLog", cascade="all, delete-orphan", backref=backref("parent", remote_side=[message_id]))
    test_sequence = relationship("OptimizedTestSequence", cascade="all, delete-orphan", backref="chat_log")
    versions = relationship("ChatLogVersion",cascade="all, delete-orphan",backref="chat_log",foreign_keys="ChatLogVersion.message_id",passive_deletes=True)
# -------------------------------
# ChatLogVersion Model
# -------------------------------
class ChatLogVersion(Base):
    __tablename__ = "chat_log_versions"

    version_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_logs.message_id", ondelete="CASCADE"), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.session_id", ondelete="CASCADE"), nullable=False)
    old_content = Column(Text)
    edited_at = Column(DateTime, default=datetime.now(timezone.utc))

# -------------------------------
# OptimizedTestSequence Model
# -------------------------------
class OptimizedTestSequence(Base):
    __tablename__ = "optimized_test_sequence"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_logs.message_id", ondelete="CASCADE"), nullable=False)
    optimized_scpi = Column(Text, nullable=False)
    order_sequence = Column(Integer, nullable=False)
    type = Column(String, nullable=False)  # 'command' or 'query'
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

# -------------------------------
# ScpiCommand Model
# -------------------------------
class ScpiCommand(Base):
    __tablename__ = "scpi_command"

    command_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#    command_text = Column(Text)
    order_index = Column(Integer)

# -------------------------------
# Dashboard Model
# -------------------------------
class Dashboard(Base):
    __tablename__ = "dashboard"

    dashboard_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    total_test_plans = Column(Integer, default=0)
    total_commands_generated = Column(Integer, default=0)
    total_reduced_redundancy = Column(Integer, default=0)
    most_used_device = Column(String)
    month = Column(Date)

# -------------------------------
# Instrument Model
# -------------------------------
# class InstrumentMetadata(Base):
#     __tablename__ = "instrument_metadata"

#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     instrument_name = Column(String, nullable=False, unique=True)
#     json_url = Column(String, nullable=False)
#     created_at = Column(DateTime, default=datetime.now(timezone.utc))
    
    
# -------------------------------
# Scan Instrument 
# -------------------------------

class DetectedInstrument(Base):
    __tablename__ = "detected_instruments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resource_string = Column(String, nullable=False, unique=True)  # VISA address
    idn = Column(String, nullable=True)  # full *IDN? response
    manufacturer = Column(String, nullable=True)
    model = Column(String, nullable=True)  # e.g., "34461A"
    serial = Column(String, nullable=True)  # e.g., "MY12345678"
    firmware = Column(String, nullable=True)  # e.g., "3.15-2.35-01.00-01.10"
    json_url = Column(String, nullable=True)  # SCPI metadata file
    is_active = Column(Boolean, default=True)
    last_seen = Column(DateTime, default=datetime.now(timezone.utc))
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

class SelectedInstrument(Base):
    __tablename__ = "selected_instruments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.session_id", ondelete="CASCADE"), nullable=False)
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_logs.message_id", ondelete="CASCADE"), nullable=True)
    instrument_id = Column(UUID(as_uuid=True), ForeignKey("detected_instruments.id", ondelete="SET NULL"))  
    resource_string = Column(String, nullable=False)
    idn = Column(String, nullable=True)
    manufacturer = Column(String, nullable=True)
    model = Column(String, nullable=True)
    serial = Column(String, nullable=True)
    firmware = Column(String, nullable=True)
    json_url = Column(String, nullable=True)
    instrument_filename = Column(String, nullable=True)
    json_url_manual = Column(String, nullable=True)  # uploaded user manual pdf
    created_at = Column(DateTime, default=datetime.now(timezone.utc))