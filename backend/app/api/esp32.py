"""
ESP32 Local CSI Pipeline Router.

Runs SerialCSILogger (USB Serial -> live_csi_data/incoming/csi_live.jsonl)
and LiveCSIInferenceEngine (csi_live.jsonl -> existing BaselineRandomForest)
inside the main FastAPI backend so the React UI on port 3000 displays live
ESP32 hardware & ML results directly.
"""

from __future__ import annotations

import json
import queue
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.services.notification_service import NotificationService
from csi_logger.serial_logger import SerialCSILogger
from inference.live_inference import LiveCSIInferenceEngine

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[3]
CONFIG_PATH = PROJECT_ROOT / "csi_logger" / "config.json"
CONTACTS_PATH = PROJECT_ROOT / "live_csi_data" / "emergency_contacts.json"
EVENTS_PATH = PROJECT_ROOT / "live_csi_data" / "events" / "fall_events.jsonl"

_logger_svc: Optional[SerialCSILogger] = None
_inference_svc: Optional[LiveCSIInferenceEngine] = None


class EmergencyContactIn(BaseModel):
    name: str
    phone: str
    relation: str = "Family"
    email: str = ""


class EscalationRequest(BaseModel):
    room_name: str = "Living Room"
    confidence: float = 0.85
    elapsed_seconds: int = 30


def _load_contacts() -> List[Dict[str, Any]]:
    if not CONTACTS_PATH.exists():
        return []
    try:
        data = json.loads(CONTACTS_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _save_contacts(contacts: List[Dict[str, Any]]) -> None:
    CONTACTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONTACTS_PATH.write_text(json.dumps(contacts, indent=2), encoding="utf-8")


def start_esp32_pipeline() -> None:
    """Initialize and start ESP32 serial logger + live ML inference once."""
    global _logger_svc, _inference_svc
    if _logger_svc is not None and _inference_svc is not None:
        return

    cfg: Dict[str, Any] = {}
    if CONFIG_PATH.exists():
        cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))

    pkt_queue: queue.Queue = queue.Queue(maxsize=2000)
    _logger_svc = SerialCSILogger(config=cfg, project_root=PROJECT_ROOT, packet_queue=pkt_queue)
    _inference_svc = LiveCSIInferenceEngine(config=cfg, project_root=PROJECT_ROOT)

    _logger_svc.archive_existing_incoming()
    _inference_svc.load_model_once()
    _inference_svc.start()
    _logger_svc.start()


def stop_esp32_pipeline() -> None:
    """Stop ESP32 serial logger and inference threads cleanly."""
    global _logger_svc, _inference_svc
    if _logger_svc is not None:
        _logger_svc.stop()
        _logger_svc = None
    if _inference_svc is not None:
        _inference_svc.stop()
        _inference_svc = None


@router.get("/status")
async def esp32_status() -> JSONResponse:
    if _logger_svc is None or _inference_svc is None:
        start_esp32_pipeline()
    return JSONResponse({
        "logger": _logger_svc.status,
        "inference": _inference_svc.status,
    })


@router.get("/events")
async def esp32_events() -> JSONResponse:
    if _inference_svc is None:
        start_esp32_pipeline()
    return JSONResponse({
        "events": _inference_svc.get_recent_events(limit=50),
    })


@router.get("/contacts")
async def list_emergency_contacts() -> JSONResponse:
    return JSONResponse({"contacts": _load_contacts()})


@router.post("/contacts")
async def add_emergency_contact(contact: EmergencyContactIn) -> JSONResponse:
    if not contact.name.strip() or not contact.phone.strip():
        raise HTTPException(status_code=400, detail="Name and phone number are required.")
    contacts = _load_contacts()
    new_item = {
        "id": int(time.time() * 1000),
        "name": contact.name.strip(),
        "phone": contact.phone.strip(),
        "relation": contact.relation.strip() or "Family",
        "email": contact.email.strip(),
    }
    contacts.append(new_item)
    _save_contacts(contacts)
    return JSONResponse({"contact": new_item, "contacts": contacts})


@router.delete("/contacts/{contact_id}")
async def delete_emergency_contact(contact_id: int) -> JSONResponse:
    contacts = _load_contacts()
    updated = [c for c in contacts if c.get("id") != contact_id]
    _save_contacts(updated)
    return JSONResponse({"contacts": updated})


@router.post("/escalate")
async def escalate_fall_emergency(req: EscalationRequest) -> JSONResponse:
    """Automatically call & notify saved emergency contacts after 30s non-recovery."""
    contacts = _load_contacts()
    notifier = NotificationService()
    now_dt = datetime.now()
    now_iso = datetime.now(timezone.utc).isoformat()

    caregivers = [
        {"name": c["name"], "phone": c.get("phone", ""), "email": c.get("email", ""), "whatsapp": c.get("phone", "")}
        for c in contacts
    ]
    delivery = notifier.send_multi_channel_alert(
        caregivers=caregivers,
        incident_type="fall_no_recovery_30s",
        room_name=req.room_name,
        confidence=req.confidence,
        timestamp=now_dt,
    )

    event = {
        "timestamp": now_iso,
        "activity": "fall",
        "display_activity": "Fall (No Recovery in 30s)",
        "confidence": round(req.confidence, 4),
        "validation_status": f"ESCALATED_AFTER_{req.elapsed_seconds}S",
        "alert_status": f"AUTO_CALL_&_NOTIFY ({len(contacts)} contacts)",
        "contacts_notified": [{"name": c["name"], "phone": c["phone"]} for c in contacts],
    }
    EVENTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(EVENTS_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(event, separators=(",", ":")) + "\n")

    return JSONResponse({
        "status": "escalated",
        "contacts_notified": contacts,
        "delivery": delivery,
        "event": event,
    })
