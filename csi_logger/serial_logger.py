"""
ESP32 USB Serial CSI Logger & Data Replay Runner.

Continuously receives JSONL CSI packets from an ESP32-WROOM-32 over USB Serial
(or replays a recorded session in DATA_REPLAY mode) and safely appends complete,
newline-terminated JSON records to live_csi_data/incoming/csi_live.jsonl.
"""

from __future__ import annotations

import json
import logging
import math
import os
import queue
import shutil
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import serial
import serial.tools.list_ports


def compute_iq_amplitude_phase(raw_iq: List[int]) -> tuple[List[float], List[float]]:
    """Convert interleaved ESP32 CSI [imag, real, ...] int8 values to amplitude and phase."""
    amplitudes: List[float] = []
    phases: List[float] = []
    n = len(raw_iq) - (len(raw_iq) % 2)
    for i in range(0, n, 2):
        imag = float(raw_iq[i])
        real = float(raw_iq[i + 1])
        amp = math.hypot(real, imag)
        phase = math.atan2(imag, real)
        amplitudes.append(round(amp, 4))
        phases.append(round(phase, 4))
    return amplitudes, phases


def validate_csi_record(obj: Dict[str, Any]) -> bool:
    """Return True if parsed JSON object is a valid CSI measurement record."""
    if not isinstance(obj, dict):
        return False
    if obj.get("type") != "csi":
        return False
    iq = obj.get("iq")
    if not isinstance(iq, list) or len(iq) < 4:
        return False
    if obj.get("valid") is False:
        return False
    return True


def auto_detect_esp32_port() -> Optional[str]:
    """Auto-detect ESP32-WROOM-32 USB serial port (Windows COM* or macOS/Linux /dev/tty*)."""
    ports = list(serial.tools.list_ports.comports())
    keywords = ("CP210", "CH340", "CH341", "FTDI", "USB", "UART", "SILABS", "ESP32")
    for port in ports:
        info = f"{port.device} {port.description} {port.manufacturer or ''}".upper()
        if any(kw in info for kw in keywords):
            return port.device
    return ports[0].device if ports else None


class SerialCSILogger:
    """Thread-safe USB serial CSI logger writing to common local JSONL dataset."""

    def __init__(
        self,
        config: Dict[str, Any],
        project_root: Path,
        packet_queue: Optional[queue.Queue] = None,
    ) -> None:
        self.config = config
        self.project_root = Path(project_root)
        self.packet_queue = packet_queue

        self.mode: str = config.get("mode", "HARDWARE_LIVE")
        self.port: Optional[str] = None if config.get("com_port", "AUTO") == "AUTO" else config.get("com_port")
        self.baud_rate: int = int(config.get("baud_rate", 921600))

        self.incoming_path = self.project_root / config.get("incoming_file", "live_csi_data/incoming/csi_live.jsonl")
        self.archive_dir = self.project_root / config.get("archive_dir", "live_csi_data/archive/timestamped_sessions")
        self.log_path = self.project_root / config.get("log_file", "live_csi_data/logs/acquisition.log")

        self.incoming_path.parent.mkdir(parents=True, exist_ok=True)
        self.archive_dir.mkdir(parents=True, exist_ok=True)
        self.log_path.parent.mkdir(parents=True, exist_ok=True)

        self._write_lock = threading.Lock()
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._serial_conn: Optional[serial.Serial] = None

        self._logger = self._setup_logger()
        self._rate_window_ts: List[float] = []

        self.status: Dict[str, Any] = {
            "mode": self.mode,
            "esp32_connected": False,
            "wifi_connected": False,
            "csi_enabled": False,
            "com_port": self.port or "AUTO",
            "baud_rate": self.baud_rate,
            "esp32_ip": None,
            "records_received": 0,
            "records_saved": 0,
            "invalid_records": 0,
            "dropped_on_esp32": 0,
            "last_packet_at": None,
            "last_packet_epoch": None,
            "last_rssi": None,
            "last_noise_floor": None,
            "last_channel": None,
            "last_amplitude_mean": None,
            "last_amplitudes": [],
            "effective_hz": 0.0,
            "last_error": None,
        }

    def _setup_logger(self) -> logging.Logger:
        logger = logging.getLogger("wifi_radar.csi_logger")
        logger.setLevel(logging.INFO)
        if not logger.handlers:
            fh = logging.FileHandler(self.log_path, encoding="utf-8")
            fh.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
            logger.addHandler(fh)
        return logger

    def archive_existing_incoming(self) -> Optional[Path]:
        """Archive non-empty csi_live.jsonl to timestamped session file without losing data."""
        with self._write_lock:
            if self.incoming_path.exists() and self.incoming_path.stat().st_size > 0:
                stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                dest = self.archive_dir / f"session_{stamp}.jsonl"
                shutil.copy2(self.incoming_path, dest)
                self._logger.info("Archived %s -> %s", self.incoming_path, dest)
                return dest
        return None

    def append_record(self, record: Dict[str, Any]) -> None:
        """Atomically append one complete newline-terminated JSON record to csi_live.jsonl."""
        line = json.dumps(record, separators=(",", ":")) + "\n"
        with self._write_lock:
            with open(self.incoming_path, "a", encoding="utf-8") as f:
                f.write(line)
                f.flush()
                os.fsync(f.fileno())
        self.status["records_saved"] += 1

        if self.packet_queue is not None:
            try:
                self.packet_queue.put_nowait(record)
            except queue.Full:
                pass

    def process_raw_line(self, raw_line: str, source_mode: str = "HARDWARE_LIVE") -> Optional[Dict[str, Any]]:
        """Validate a single serial JSONL line, enrich with amplitude/phase, and save if valid."""
        text = raw_line.strip()
        if not text:
            return None

        try:
            obj = json.loads(text)
        except json.JSONDecodeError:
            self.status["invalid_records"] += 1
            return None

        msg_type = obj.get("type")
        if msg_type == "status":
            ev = obj.get("event", "")
            if ev == "wifi_connected":
                self.status["wifi_connected"] = True
                self.status["esp32_ip"] = obj.get("ip")
                self.status["last_channel"] = obj.get("channel")
                self.status["last_rssi"] = obj.get("rssi")
            elif ev in ("wifi_disconnected_reconnecting", "wifi_connect_failed"):
                self.status["wifi_connected"] = False
                self.status["csi_enabled"] = False
            elif ev == "csi_enabled":
                self.status["csi_enabled"] = True
            self._logger.info("ESP32 status: %s", obj)
            return None

        if msg_type == "heartbeat":
            self.status["wifi_connected"] = True
            self.status["esp32_ip"] = obj.get("ip") or self.status["esp32_ip"]
            self.status["last_rssi"] = obj.get("rssi")
            self.status["last_channel"] = obj.get("channel")
            self.status["dropped_on_esp32"] = obj.get("dropped", 0)
            return None

        if msg_type == "error":
            self.status["last_error"] = obj.get("msg", "ESP32 firmware error")
            self._logger.error("ESP32 error: %s", self.status["last_error"])
            return None

        if not validate_csi_record(obj):
            self.status["invalid_records"] += 1
            return None

        self.status["records_received"] += 1
        amplitudes, phases = compute_iq_amplitude_phase(obj["iq"])
        amp_mean = round(sum(amplitudes) / len(amplitudes), 4) if amplitudes else 0.0

        now_epoch = time.time()
        now_iso = datetime.now(timezone.utc).isoformat()

        enriched: Dict[str, Any] = {
            "type": "csi",
            "source_mode": source_mode,
            "received_at": now_iso,
            "ts_ms": obj.get("ts_ms"),
            "seq": obj.get("seq"),
            "mac": obj.get("mac"),
            "rssi": obj.get("rssi"),
            "noise_floor": obj.get("noise_floor"),
            "channel": obj.get("channel"),
            "sig_mode": obj.get("sig_mode"),
            "mcs": obj.get("mcs"),
            "cwb": obj.get("cwb"),
            "csi_len": obj.get("csi_len"),
            "valid": bool(obj.get("valid", True)),
            "iq": obj["iq"],
            "amplitude": amplitudes,
            "phase": phases,
            "amplitude_mean": amp_mean,
        }

        self.append_record(enriched)

        self._rate_window_ts.append(now_epoch)
        cutoff = now_epoch - 2.0
        self._rate_window_ts = [t for t in self._rate_window_ts if t >= cutoff]
        if len(self._rate_window_ts) >= 2:
            span = self._rate_window_ts[-1] - self._rate_window_ts[0]
            self.status["effective_hz"] = round((len(self._rate_window_ts) - 1) / max(span, 1e-3), 1)

        self.status["wifi_connected"] = True
        self.status["csi_enabled"] = True
        self.status["last_packet_at"] = now_iso
        self.status["last_packet_epoch"] = now_epoch
        self.status["last_rssi"] = enriched["rssi"]
        self.status["last_noise_floor"] = enriched["noise_floor"]
        self.status["last_channel"] = enriched["channel"]
        self.status["last_amplitude_mean"] = amp_mean
        self.status["last_amplitudes"] = amplitudes[:52]
        self.status["last_error"] = None
        return enriched

    def _run_hardware_loop(self) -> None:
        self._logger.info("Starting HARDWARE_LIVE serial logger (port=%s, baud=%d)", self.port or "AUTO", self.baud_rate)
        while not self._stop_event.is_set():
            target_port = self.port or auto_detect_esp32_port()
            if not target_port:
                self.status["esp32_connected"] = False
                self.status["com_port"] = "NOT_FOUND"
                self.status["last_error"] = "No ESP32 COM port detected. Connect ESP32 via USB."
                self._stop_event.wait(2.0)
                continue

            try:
                self.status["com_port"] = target_port
                self._serial_conn = serial.Serial(port=target_port, baudrate=self.baud_rate, timeout=1.0)
                self.status["esp32_connected"] = True
                self.status["last_error"] = None
                self._logger.info("Connected to ESP32 on %s @ %d", target_port, self.baud_rate)

                while not self._stop_event.is_set() and self._serial_conn.is_open:
                    raw_bytes = self._serial_conn.readline()
                    if not raw_bytes:
                        continue
                    # Only process complete newline-terminated records
                    if not raw_bytes.endswith(b"\n"):
                        self.status["invalid_records"] += 1
                        continue
                    line = raw_bytes.decode("utf-8", errors="ignore")
                    self.process_raw_line(line, source_mode="HARDWARE_LIVE")

            except (serial.SerialException, OSError) as exc:
                self.status["esp32_connected"] = False
                self.status["csi_enabled"] = False
                self.status["last_error"] = f"Serial disconnected ({target_port}): {exc}"
                self._logger.warning("Serial error on %s: %s", target_port, exc)
                if self._serial_conn:
                    try:
                        self._serial_conn.close()
                    except Exception:
                        pass
                    self._serial_conn = None
                self._stop_event.wait(2.0)

    def _run_replay_loop(self) -> None:
        replay_rel = self.config.get("replay_file", "")
        replay_path = self.project_root / replay_rel if replay_rel else None

        if not replay_path or not replay_path.exists():
            sessions = sorted(self.archive_dir.glob("*.jsonl"))
            replay_path = sessions[-1] if sessions else None

        if not replay_path or not replay_path.exists():
            self.status["last_error"] = "DATA_REPLAY selected, but no recorded .jsonl session found in archive."
            self._logger.error(self.status["last_error"])
            return

        speed = max(float(self.config.get("replay_speed", 1.0)), 0.1)
        delay = 0.02 / speed
        self.status["com_port"] = f"REPLAY:{replay_path.name}"
        self.status["esp32_connected"] = False
        self._logger.info("Starting DATA_REPLAY from %s", replay_path)

        while not self._stop_event.is_set():
            with open(replay_path, "r", encoding="utf-8") as f:
                for line in f:
                    if self._stop_event.is_set():
                        break
                    self.process_raw_line(line, source_mode="DATA_REPLAY")
                    self._stop_event.wait(delay)

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        target = self._run_replay_loop if self.mode == "DATA_REPLAY" else self._run_hardware_loop
        self._thread = threading.Thread(target=target, name="CSISerialLogger", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._serial_conn and self._serial_conn.is_open:
            try:
                self._serial_conn.close()
            except Exception:
                pass
        if self._thread:
            self._thread.join(timeout=3.0)
        self.status["esp32_connected"] = False
        self._logger.info("SerialCSILogger stopped.")
