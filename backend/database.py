"""
Database configuration and models.
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Database URL from environment or default to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./wifi_radar.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models

class User(Base):
    """User model."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default="caregiver")  # admin, caregiver, viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    rooms = relationship("Room", back_populates="owner")


class Device(Base):
    """ESP32 device model."""
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True)
    mac_address = Column(String)
    name = Column(String)
    status = Column(String, default="offline")  # online, offline, error
    last_seen = Column(DateTime)
    firmware_version = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    room = relationship("Room", back_populates="device", uselist=False)


class Room(Base):
    """Monitored room model."""
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    location = Column(String)
    device_id = Column(Integer, ForeignKey("devices.id"))
    owner_id = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    device = relationship("Device", back_populates="room")
    owner = relationship("User", back_populates="rooms")
    activities = relationship("ActivityEvent", back_populates="room")
    incidents = relationship("Incident", back_populates="room")


class ActivityEvent(Base):
    """Activity detection event."""
    __tablename__ = "activity_events"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    activity_type = Column(String)  # Jump, Fall, Sit, Stand, Walk
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    event_metadata = Column("metadata", JSON)  # Additional data
    
    # Relationships
    room = relationship("Room", back_populates="activities")


class Incident(Base):
    """Fall/emergency incident."""
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    incident_type = Column(String, default="fall")
    status = Column(String, default="pending")  # pending, acknowledged, resolved, false_alarm
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    notes = Column(String, nullable=True)
    is_false_alarm = Column(Boolean, default=False)
    
    # Relationships
    room = relationship("Room", back_populates="incidents")
    notifications = relationship("Notification", back_populates="incident")


class Notification(Base):
    """Notification sent to caregivers."""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    channel = Column(String)  # email, sms, whatsapp, app
    status = Column(String, default="sent")  # sent, delivered, failed, read
    sent_at = Column(DateTime, default=datetime.utcnow)
    delivered_at = Column(DateTime, nullable=True)
    
    # Relationships
    incident = relationship("Incident", back_populates="notifications")


class CSIRecord(Base):
    """CSI data record (optional, for debugging)."""
    __tablename__ = "csi_records"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    rssi = Column(Integer)
    csi_data = Column(JSON)  # Compressed CSI data
    signal_quality = Column(Float)


# Dependency to get database session
def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
