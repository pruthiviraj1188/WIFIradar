"""
Software & Failure Tests for ESP32 CSI -> Common JSONL -> Existing ML -> Dashboard Pipeline.
"""

import json
import sys
import time
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ai.activity_detection.baseline_model import BaselineRandomForest
from csi_logger.serial_logger import SerialCSILogger, compute_iq_amplitude_phase
from dashboard.app import create_dashboard_app
from inference.live_inference import LiveCSIInferenceEngine


def _make_config(tmp_path: Path, model_path: Path | None = None) -> dict:
    return {
        "mode": "HARDWARE_LIVE",
        "com_port": "AUTO",
        "baud_rate": 921600,
        "dashboard_host": "127.0.0.1",
        "dashboard_port": 8000,
        "incoming_file": "live_csi_data/incoming/csi_live.jsonl",
        "archive_dir": "live_csi_data/archive/timestamped_sessions",
        "events_file": "live_csi_data/events/fall_events.jsonl",
        "log_file": "live_csi_data/logs/acquisition.log",
        "model_path": str(model_path) if model_path else "ai/saved_models/missing_model.joblib",
        "window_size": 200,
        "window_step": 10,
        "expected_sampling_rate_hz": 50.0,
        "fall_confidence_threshold": 0.5,
        "fall_temporal_window": 3,
        "fall_temporal_min_hits": 2,
        "sensor_offline_timeout_sec": 0.2,
    }


def _sample_csi_line(seq: int, amp_val: int = 10) -> str:
    iq = [amp_val, 0] * 52
    return json.dumps({
        "type": "csi",
        "ts_ms": 1000 + seq * 20,
        "seq": seq,
        "rssi": -55,
        "noise_floor": -92,
        "channel": 6,
        "sig_mode": 1,
        "mcs": 7,
        "cwb": 0,
        "csi_len": len(iq),
        "mac": "AA:BB:CC:DD:EE:FF",
        "valid": True,
        "iq": iq,
    })


def test_iq_amplitude_phase_and_invalid_lines(tmp_path: Path):
    amps, phases = compute_iq_amplitude_phase([3, 4, 0, 5])
    assert amps == [5.0, 5.0]
    assert len(phases) == 2

    cfg = _make_config(tmp_path)
    logger = SerialCSILogger(cfg, tmp_path)

    # Malformed JSON, invalid flag, and status lines
    assert logger.process_raw_line("{bad json") is None
    assert logger.process_raw_line(json.dumps({"type": "csi", "valid": False, "iq": [1, 2, 3, 4]})) is None
    assert logger.status["invalid_records"] == 2

    # Valid CSI line
    rec = logger.process_raw_line(_sample_csi_line(1))
    assert rec is not None
    assert rec["amplitude_mean"] == 10.0
    assert logger.status["records_saved"] == 1


def test_incremental_tailing_ignores_partial_lines_and_duplicates(tmp_path: Path):
    cfg = _make_config(tmp_path)
    logger = SerialCSILogger(cfg, tmp_path)
    engine = LiveCSIInferenceEngine(cfg, tmp_path)
    engine.load_model_once()  # Missing model -> MODEL_NOT_FOUND
    assert engine.status["system_state"] == "MODEL_NOT_FOUND"

    incoming = tmp_path / cfg["incoming_file"]
    # Write a partial line without trailing newline
    partial = _sample_csi_line(1)
    incoming.write_text(partial[:-5], encoding="utf-8")
    engine.step_once()
    assert engine.status["records_processed"] == 0

    # Complete the line + add duplicate seq
    with open(incoming, "a", encoding="utf-8") as f:
        f.write(partial[-5:] + "\n")
        f.write(_sample_csi_line(1) + "\n")
        f.write(_sample_csi_line(2) + "\n")

    engine.step_once()
    assert engine.status["records_processed"] == 2
    assert engine.status["buffer_fill"] == 2


def test_end_to_end_inference_and_dashboard(tmp_path: Path):
    # Train a tiny BaselineRandomForest on 38 features in tmp_path (does not touch repo weights)
    rng = np.random.default_rng(42)
    X = rng.normal(size=(40, 38)).astype(np.float32)
    y = np.array([1] * 40)  # all class 1 ('fall') to deterministically test fall event pipeline
    feature_names_path = PROJECT_ROOT / "datasets" / "metadata" / "feature_names.json"
    feature_names = json.loads(feature_names_path.read_text(encoding="utf-8"))

    rf = BaselineRandomForest(n_estimators=10, random_state=42)
    rf.train(X, y, feature_names=feature_names, class_names={1: "fall"})
    model_file = tmp_path / "test_rf.joblib"
    rf.save(model_file)

    cfg = _make_config(tmp_path, model_path=model_file)
    logger = SerialCSILogger(cfg, tmp_path)
    engine = LiveCSIInferenceEngine(cfg, tmp_path)
    assert engine.load_model_once() is True

    # Feed 199 packets -> INSUFFICIENT_DATA (never classifies as fallen)
    for seq in range(1, 200):
        logger.process_raw_line(_sample_csi_line(seq, amp_val=10 + (seq % 5)))
    engine.step_once()
    assert engine.status["system_state"] == "INSUFFICIENT_DATA"

    # Feed 20 more packets -> triggers window inference & temporal fall validation
    for seq in range(200, 225):
        logger.process_raw_line(_sample_csi_line(seq, amp_val=10 + (seq % 7)))
    engine.step_once()

    assert engine.status["predicted_label"] == "fall"
    assert engine.status["system_state"] == "POTENTIAL_FALL"
    assert engine.status["fall_events_count"] >= 1

    # Wait > offline_timeout -> transitions to SENSOR_OFFLINE
    time.sleep(0.25)
    engine.step_once()
    assert engine.status["system_state"] == "SENSOR_OFFLINE"

    # Verify FastAPI dashboard endpoints
    app = create_dashboard_app(logger, engine)
    client = TestClient(app)
    assert client.get("/").status_code == 200
    assert client.get("/health").json()["model_loaded"] is True
    assert client.get("/api/status").json()["inference"]["fall_events_count"] >= 1
    assert len(client.get("/api/events").json()["events"]) >= 1
