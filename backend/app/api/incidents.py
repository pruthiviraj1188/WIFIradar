"""
Incident management API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ..database import get_db, Incident, Room
from .auth import get_current_user, User

router = APIRouter()

# Pydantic models
class IncidentCreate(BaseModel):
    room_id: int
    incident_type: str = "fall"
    confidence: float
    metadata: Optional[dict] = None

class IncidentResponse(BaseModel):
    id: int
    room_id: int
    incident_type: str
    status: str
    confidence: float
    timestamp: datetime
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]
    notes: Optional[str]
    is_false_alarm: bool
    
    class Config:
        from_attributes = True

class IncidentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    is_false_alarm: Optional[bool] = None

# API Endpoints
@router.get("/", response_model=List[IncidentResponse])
async def get_incidents(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of incidents."""
    query = db.query(Incident)
    
    if status:
        query = query.filter(Incident.status == status)
    
    incidents = query.order_by(Incident.timestamp.desc()).offset(skip).limit(limit).all()
    return incidents

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific incident."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.post("/", response_model=IncidentResponse)
async def create_incident(
    incident: IncidentCreate,
    db: Session = Depends(get_db)
):
    """Create new incident (called by monitoring system)."""
    new_incident = Incident(**incident.dict(exclude={'metadata'}))
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)
    
    # TODO: Trigger notification system here
    
    return new_incident

@router.patch("/{incident_id}/acknowledge", response_model=IncidentResponse)
async def acknowledge_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Acknowledge an incident."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident.status = "acknowledged"
    incident.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(incident)
    
    return incident

@router.patch("/{incident_id}/resolve", response_model=IncidentResponse)
async def resolve_incident(
    incident_id: int,
    update: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Resolve an incident."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident.status = "resolved"
    incident.resolved_at = datetime.utcnow()
    
    if update.notes:
        incident.notes = update.notes
    if update.is_false_alarm is not None:
        incident.is_false_alarm = update.is_false_alarm
        if update.is_false_alarm:
            incident.status = "false_alarm"
    
    db.commit()
    db.refresh(incident)
    
    return incident

@router.get("/stats/summary")
async def get_incident_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get incident statistics."""
    total = db.query(Incident).count()
    pending = db.query(Incident).filter(Incident.status == "pending").count()
    acknowledged = db.query(Incident).filter(Incident.status == "acknowledged").count()
    resolved = db.query(Incident).filter(Incident.status == "resolved").count()
    false_alarms = db.query(Incident).filter(Incident.is_false_alarm == True).count()
    
    return {
        "total": total,
        "pending": pending,
        "acknowledged": acknowledged,
        "resolved": resolved,
        "false_alarms": false_alarms,
        "false_alarm_rate": false_alarms / total if total > 0 else 0
    }
