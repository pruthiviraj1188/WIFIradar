"""
Live ML Inference Engine for WiFi-Radar.

Incrementally tails live_csi_data/incoming/csi_live.jsonl (reading only newly
appended, complete newline-terminated JSON records), accumulates 200-sample
windows, runs the existing SignalProcessor + FeatureExtractor + BaselineRandomForest
pipeline without modifying model weights, and performs temporal fall validation.
"""

from __future__ import annotations

import json
import logging
import os
import threading
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Deque, Dict, List, Optional

import numpy as np

from ai.activity_detection.baseline_model import BaselineRandomForest
from ai.preprocessing.feature_extractor import FeatureExtractor
from ai.preprocessing.signal_processor import SignalProcessor
from backend.services.notification_service import NotificationService
from csi_logger.serial_logger import compute_iq_amplitude_phase

DISPLAY_LABELS = {
    "walk": "Walking",
    "stand": "Standing",
    "sit": "Sitting / Sleeping",
    "fall": "Falling",
    "Jump": "Jumping",
}


class LiveCSIInferenceEngine:
    """Incremental JSONL tailer + window accumulator + existing ML inference."""

    def __init__(self, config: Dict[str, Any], project_root: Path) -> None:
        self.config = config
        self.project_root = Path(project_root)

        self.incoming_path = self.project_root / config.get("incoming_file", "live_csi_data/incoming/csi_live.jsonl")
        self.events_path = self.project_root / config.get("events_file", "live_csi_data/events/fall_events.jsonl")
        self.model_path = self.project_root / config.get("model_path", "ai/saved_models/baseline_rf_model.joblib")
        self.log_path = self.project_root / config.get("log_file", "live_csi_data/logs/acquisition.log")

        self.events_path.parent.mkdir(parents=True, exist_ok=True)
        self.window_size = int(config.get("window_size", 200))
        self.window_step = int(config.get("window_step", 25))
        self.expected_hz = float(config.get("expected_sampling_rate_hz", 50.0))
        self.fall_threshold = float(config.get("fall_confidence_threshold", 0.65))
        self.temporal_window = int(config.get("fall_temporal_window", 3))
        self.temporal_min_hits = int(config.get("fall_temporal_min_hits", 2))
        self.offline_timeout = float(config.get("sensor_offline_timeout_sec", 5.0))

        # Existing preprocessing & feature extraction (preserved unmodified)
        self.signal_processor = SignalProcessor(
            window_size=self.window_size,
            window_overlap=0,
            sampling_rate=self.expected_hz,
        )
        self.feature_extractor = FeatureExtractor(sampling_rate=self.expected_hz)
        self.notifier = NotificationService()

        self.model: Optional[BaselineRandomForest] = None
        self.model_loaded = False
        self.model_error: Optional[str] = None

        self._file_offset = 0
        self._last_seq: Optional[int] = None
        self._buffer: Deque[float] = deque(maxlen=self.window_size)
        self._samples_since_infer = 0
        self._recent_fall_hits: Deque[bool] = deque(maxlen=self.temporal_window)
        self._last_fall_event_epoch = 0.0
        self._last_record_epoch: Optional[float] = None

        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._events_lock = threading.Lock()
        self._logger = logging.getLogger("wifi_radar.inference")

        self.status: Dict[str, Any] = {
            "system_state": "INSUFFICIENT_DATA",  # NORMAL_MONITORING | POTENTIAL_FALL | SENSOR_OFFLINE | INSUFFICIENT_DATA | MODEL_NOT_FOUND
            "inference_status": "INITIALIZING",
            "model_loaded": False,
            "model_path": str(self.model_path),
            "model_error": None,
            "compatibility_warning": None,
            "records_processed": 0,
            "buffer_fill": 0,
            "window_size": self.window_size,
            "predicted_label": None,
            "predicted_display": None,
            "confidence": None,
            "probabilities": {},
            "last_prediction_at": None,
            "fall_events_count": self._count_existing_events(),
            "recent_events": self.get_recent_events(limit=20),
        }

    def _count_existing_events(self) -> int:
        if not self.events_path.exists():
            return 0
        with open(self.events_path, "r", encoding="utf-8") as f:
            return sum(1 for line in f if line.strip())

    def get_recent_events(self, limit: int = 20) -> List[Dict[str, Any]]:
        if not self.events_path.exists():
            return []
        events: List[Dict[str, Any]] = []
        with open(self.events_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    events.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        return list(reversed(events[-limit:]))

    def load_model_once(self) -> bool:
        """Load the existing trained BaselineRandomForest model once without modifying weights."""
        if self.model_loaded and self.model is not None:
            return True

        if not self.model_path.exists():
            self.model_loaded = False
            self.model_error = (
                f"Existing trained model not found at {self.model_path}. "
                "Run 'python ai/train_activity_classifier.py' to generate baseline_rf_model.joblib."
            )
            self.status["model_loaded"] = False
            self.status["model_error"] = self.model_error
            self.status["inference_status"] = "MODEL_NOT_FOUND"
            self.status["system_state"] = "MODEL_NOT_FOUND"
            return False

        try:
            rf = BaselineRandomForest()
            rf.load(self.model_path)
            self.model = rf
            self.model_loaded = True
            self.model_error = None
            self.status["model_loaded"] = True
            self.status["model_error"] = None
            self.status["inference_status"] = "READY"
            self._logger.info("Loaded existing model from %s", self.model_path)
            return True
        except Exception as exc:
            self.model_loaded = False
            self.model_error = f"Failed to load model: {exc}"
            self.status["model_loaded"] = False
            self.status["model_error"] = self.model_error
            self.status["inference_status"] = "MODEL_ERROR"
            return False

    def _read_new_complete_lines(self) -> List[Dict[str, Any]]:
        """Read only complete newline-terminated JSON records appended since last offset."""
        if not self.incoming_path.exists():
            return []

        file_size = self.incoming_path.stat().st_size
        if file_size < self._file_offset:
            # File was rotated/truncated
            self._file_offset = 0

        if file_size == self._file_offset:
            return []

        records: List[Dict[str, Any]] = []
        with open(self.incoming_path, "r", encoding="utf-8") as f:
            f.seek(self._file_offset)
            chunk = f.read()

        # Only consume up to the last complete newline so partial writes are never parsed
        last_nl = chunk.rfind("\n")
        if last_nl == -1:
            return []

        complete_part = chunk[: last_nl + 1]
        self._file_offset += len(complete_part.encode("utf-8"))

        for line in complete_part.splitlines():
            text = line.strip()
            if not text:
                continue
            try:
                obj = json.loads(text)
            except json.JSONDecodeError:
                continue

            seq = obj.get("seq")
            if seq is not None and self._last_seq is not None and seq == self._last_seq:
                continue
            if seq is not None:
                self._last_seq = seq
            records.append(obj)

        return records

    def _extract_scalar_amplitude(self, record: Dict[str, Any]) -> Optional[float]:
        if "amplitude_mean" in record and record["amplitude_mean"] is not None:
            return float(record["amplitude_mean"])
        amp = record.get("amplitude")
        if isinstance(amp, list) and amp:
            return float(np.mean(amp))
        iq = record.get("iq")
        if isinstance(iq, list) and len(iq) >= 2:
            amps, _ = compute_iq_amplitude_phase(iq)
            return float(np.mean(amps)) if amps else None
        return None

    def _run_window_inference(self) -> None:
        if not self.model_loaded or self.model is None:
            return

        signal_1d = np.array(self._buffer, dtype=np.float32)

        # Apply exact existing preprocessing pipeline
        processed = self.signal_processor.process_pipeline(
            signal_1d,
            apply_filter=True,
            remove_outliers=True,
            normalize=True,
            normalization_method="minmax",
        )
        processed = self.signal_processor.pad_or_truncate(processed, self.window_size)

        # Extract exact 38 features
        feat_dict = self.feature_extractor.extract_all_features(processed)
        feature_names = self.model.feature_names or sorted(feat_dict.keys())
        feature_vec = np.array([[feat_dict[name] for name in feature_names]], dtype=np.float32)

        # Verify feature dimensionality compatibility
        expected_features = getattr(self.model.model, "n_features_in_", len(feature_names))
        if feature_vec.shape[1] != expected_features:
            self.status["compatibility_warning"] = (
                f"Feature mismatch: extracted {feature_vec.shape[1]} features, "
                f"model expects {expected_features}. Calibration required."
            )
            self.status["inference_status"] = "COMPATIBILITY_ERROR"
            return

        proba = self.model.model.predict_proba(feature_vec)[0]
        classes = list(self.model.model.classes_)
        best_idx = int(np.argmax(proba))
        raw_class_id = classes[best_idx]
        confidence = float(proba[best_idx])

        if self.model.class_names and raw_class_id in self.model.class_names:
            label = str(self.model.class_names[raw_class_id])
        else:
            label = str(raw_class_id)

        prob_map: Dict[str, float] = {}
        for idx, cid in enumerate(classes):
            cname = self.model.class_names[cid] if (self.model.class_names and cid in self.model.class_names) else str(cid)
            prob_map[cname] = round(float(proba[idx]), 4)

        now_iso = datetime.now(timezone.utc).isoformat()
        self.status["predicted_label"] = label
        self.status["predicted_display"] = DISPLAY_LABELS.get(label, label)
        self.status["confidence"] = round(confidence, 4)
        self.status["probabilities"] = prob_map
        self.status["last_prediction_at"] = now_iso
        self.status["inference_status"] = "ACTIVE"

        # Temporal fall validation
        is_fall_hit = (label.lower() == "fall") and (confidence >= self.fall_threshold)
        self._recent_fall_hits.append(is_fall_hit)

        if sum(self._recent_fall_hits) >= self.temporal_min_hits:
            self.status["system_state"] = "POTENTIAL_FALL"
            self._record_fall_event(label, confidence, now_iso)
        else:
            self.status["system_state"] = "NORMAL_MONITORING"

    def _record_fall_event(self, label: str, confidence: float, timestamp_iso: str) -> None:
        now = time.time()
        # Cooldown of 10 seconds to avoid duplicate alerts for the same fall event
        if now - self._last_fall_event_epoch < 10.0:
            return
        self._last_fall_event_epoch = now

        alert_sent = False
        caregiver_email = os.getenv("CAREGIVER_EMAIL", "")
        if caregiver_email:
            try:
                alert_sent = self.notifier.send_fall_alert(
                    caregiver_email=caregiver_email,
                    room_name="Monitored Room (ESP32)",
                    confidence=confidence,
                    timestamp=datetime.now(),
                )
            except Exception as exc:
                self._logger.warning("Alert notification failed: %s", exc)

        event = {
            "timestamp": timestamp_iso,
            "activity": label,
            "display_activity": DISPLAY_LABELS.get(label, label),
            "confidence": round(confidence, 4),
            "validation_status": f"CONFIRMED ({sum(self._recent_fall_hits)}/{len(self._recent_fall_hits)} windows)",
            "alert_status": "EMAIL_SENT" if alert_sent else "LOCAL_ALERT_TRIGGERED",
        }

        with self._events_lock:
            with open(self.events_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(event, separators=(",", ":")) + "\n")
                f.flush()

        self.status["fall_events_count"] += 1
        self.status["recent_events"] = self.get_recent_events(limit=20)
        self._logger.warning("POTENTIAL_FALL recorded: %s", event)

    def step_once(self) -> None:
        """Process any newly appended CSI records and run inference when window is ready."""
        new_records = self._read_new_complete_lines()
        now = time.time()

        if new_records:
            self._last_record_epoch = now
            for rec in new_records:
                amp = self._extract_scalar_amplitude(rec)
                if amp is None:
                    continue
                self._buffer.append(amp)
                self.status["records_processed"] += 1
                self._samples_since_infer += 1

                if len(self._buffer) >= self.window_size and self._samples_since_infer >= self.window_step:
                    self._samples_since_infer = 0
                    self._run_window_inference()

            self.status["buffer_fill"] = len(self._buffer)

        # Check sensor offline / insufficient data states (never classify missing data as a fall)
        if not self.model_loaded:
            self.status["system_state"] = "MODEL_NOT_FOUND"
        elif self._last_record_epoch is None or (now - self._last_record_epoch > self.offline_timeout):
            if self.status["records_processed"] == 0:
                self.status["system_state"] = "INSUFFICIENT_DATA"
            else:
                self.status["system_state"] = "SENSOR_OFFLINE"
        elif len(self._buffer) < self.window_size:
            self.status["system_state"] = "INSUFFICIENT_DATA"

    def _run_loop(self) -> None:
        self.load_model_once()
        while not self._stop_event.is_set():
            try:
                self.step_once()
            except Exception as exc:
                self.status["inference_status"] = f"ERROR: {exc}"
                self._logger.exception("Inference loop error")
            self._stop_event.wait(0.1)

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_loop, name="LiveCSIInference", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=3.0)
