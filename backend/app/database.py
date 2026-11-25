"""
Database configuration - app-level module that re-exports from backend/database.py
"""
import sys
from pathlib import Path

# Add backend root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.database import (
    engine, SessionLocal, Base,
    User, Device, Room, ActivityEvent, Incident
)

def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

__all__ = [
    "engine", "SessionLocal", "Base", "get_db",
    "User", "Device", "Room", "ActivityEvent", "Incident"
]
