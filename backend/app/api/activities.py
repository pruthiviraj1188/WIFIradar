"""Activity tracking API."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db, ActivityEvent
from .auth import get_current_user

router = APIRouter()

@router.get("/")
async def list_activities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(ActivityEvent).order_by(ActivityEvent.timestamp.desc()).offset(skip).limit(limit).all()
