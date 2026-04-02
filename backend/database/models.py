from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.sql import func
import uuid
from backend.database.db import Base

class SimulationSessionModel(Base):
    __tablename__ = "simulation_sessions"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    decision_text = Column(Text, nullable=False)
    category = Column(String, nullable=True)
    status = Column(String, default="running")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ReportModel(Base):
    __tablename__ = "reports"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, index=True)
    report_json = Column(Text, nullable=False)
    share_id = Column(String, index=True, nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AgentLogModel(Base):
    __tablename__ = "agent_logs"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, index=True)
    agent_name = Column(String, nullable=False)
    round_number = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
