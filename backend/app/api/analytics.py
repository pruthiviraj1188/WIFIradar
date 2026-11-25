"""Analytics API."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db, ActivityEvent, Incident
from .auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/daily")
async def daily_analytics(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get daily activity analytics."""
    today = datetime.utcnow().date()
    
    activities_today = db.query(ActivityEvent).filter(
        func.date(ActivityEvent.timestamp) == today
    ).count()
    
    incidents_today = db.query(Incident).filter(
        func.date(Incident.timestamp) == today
    ).count()
    
    return {
        "date": today.isoformat(),
        "activities_detected": activities_today,
        "incidents": incidents_today
    }
