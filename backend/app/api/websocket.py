"""
WebSocket endpoint for real-time CSI data streaming and activity alerts.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import asyncio
import json
import random
import math
import time
from datetime import datetime

router = APIRouter()


class ConnectionManager:
    """Manage WebSocket connections."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.room_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: int = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if room_id:
            if room_id not in self.room_connections:
                self.room_connections[room_id] = set()
            self.room_connections[room_id].add(websocket)

    def disconnect(self, websocket: WebSocket, room_id: int = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if room_id and room_id in self.room_connections:
            self.room_connections[room_id].discard(websocket)

    async def broadcast(self, message: dict):
        """Broadcast to all connected clients."""
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for conn in dead:
            self.disconnect(conn)

    async def broadcast_to_room(self, room_id: int, message: dict):
        """Broadcast to clients subscribed to a specific room."""
        if room_id not in self.room_connections:
            return
        dead = []
        for conn in list(self.room_connections[room_id]):
            try:
                await conn.send_json(message)
            except Exception:
                dead.append(conn)
        for conn in dead:
            self.disconnect(conn, room_id)


manager = ConnectionManager()

ACTIVITIES = ["walk", "stand", "sit", "Jump", "fall"]
ACTIVITY_WEIGHTS = [0.35, 0.25, 0.20, 0.15, 0.05]  # fall is rare


def _generate_csi_sample(activity: str, t: float) -> List[float]:
    """Generate synthetic CSI amplitude values for demo/simulation."""
    n_subcarriers = 52
    base_freq = {"walk": 2.0, "stand": 0.5, "sit": 0.3, "Jump": 4.0, "fall": 8.0}.get(activity, 1.0)
    amplitude = {"walk": 0.4, "stand": 0.1, "sit": 0.08, "Jump": 0.6, "fall": 0.9}.get(activity, 0.2)
    noise = {"walk": 0.05, "stand": 0.02, "sit": 0.02, "Jump": 0.08, "fall": 0.15}.get(activity, 0.03)

    csi = []
    for i in range(n_subcarriers):
        phase_offset = i * (2 * math.pi / n_subcarriers)
        val = (
            amplitude * math.sin(2 * math.pi * base_freq * t + phase_offset)
            + random.gauss(0, noise)
        )
        csi.append(round(val, 4))
    return csi


@router.websocket("/csi/{room_id}")
async def csi_stream(websocket: WebSocket, room_id: int):
    """Stream real-time CSI data for a specific room."""
    await manager.connect(websocket, room_id)
    t = 0.0
    current_activity = "stand"
    activity_duration = 0
    max_duration = random.randint(30, 100)  # frames before activity change
    breathing_phase = 0.0  # For breathing rate simulation

    try:
        while True:
            # Occasionally switch activity
            activity_duration += 1
            if activity_duration > max_duration:
                current_activity = random.choices(ACTIVITIES, weights=ACTIVITY_WEIGHTS)[0]
                activity_duration = 0
                max_duration = random.randint(30, 150)

            csi = _generate_csi_sample(current_activity, t)
            confidence = round(random.uniform(0.6, 0.98), 3)

            # Generate breathing rate (12-20 BPM normal range)
            # Simulate realistic breathing patterns with slight variations
            base_bpm = 15.5
            if current_activity == "walk":
                base_bpm = 18.0  # Faster breathing when walking
            elif current_activity == "Jump":
                base_bpm = 22.0  # Even faster when jumping
            elif current_activity == "fall":
                base_bpm = 24.0  # Irregular/fast after fall
            elif current_activity in ["sit", "stand"]:
                base_bpm = 14.5  # Slower at rest
            
            # Add natural variation
            breathing_bpm = round(base_bpm + math.sin(breathing_phase) * 1.5 + random.gauss(0, 0.3), 1)
            breathing_bpm = max(10.0, min(26.0, breathing_bpm))  # Clamp to realistic range
            breathing_phase += 0.1

            payload = {
                "type": "csi_update",
                "room_id": room_id,
                "timestamp": datetime.utcnow().isoformat(),
                "activity": current_activity,
                "confidence": confidence,
                "csi_data": csi,
                "rssi": random.randint(-75, -30),
                "frame": int(t * 10),
                "breathing_bpm": breathing_bpm,  # Add breathing rate to payload
            }

            # Send fall alert if activity is fall
            if current_activity == "fall":
                payload["alert"] = {
                    "type": "fall_detected",
                    "severity": "high",
                    "message": f"Fall detected in room {room_id} with {confidence:.0%} confidence",
                    "timestamp": datetime.utcnow().isoformat()
                }

            await websocket.send_json(payload)
            t += 0.1
            await asyncio.sleep(0.1)  # 10 Hz update rate

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)


@router.websocket("/alerts")
async def alert_stream(websocket: WebSocket):
    """Stream system-wide alerts."""
    await manager.connect(websocket)
    try:
        while True:
            # Heartbeat ping every 30 seconds
            await asyncio.sleep(30)
            await websocket.send_json({
                "type": "heartbeat",
                "timestamp": datetime.utcnow().isoformat(),
                "active_connections": len(manager.active_connections)
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
