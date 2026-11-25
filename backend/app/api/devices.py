"""Device management API."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db, Device
from .auth import get_current_user

router = APIRouter()

@router.get("/")
async def list_devices(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Device).all()
