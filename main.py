#!/usr/bin/env python3
"""
WiFi-Radar Single-Command Local Execution Entry Point.

Runs the complete local system on ONE website (port 3000) + backend (port 8080):
  - FastAPI Backend on http://127.0.0.1:8080 (with ESP32 Serial Logger + live_csi_data + ML Inference)
  - React + 3D Frontend on http://localhost:3000
"""

from __future__ import annotations

import os
import shutil
import signal
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent


def main() -> int:
    os.chdir(PROJECT_ROOT)

    backend_cmd = [
        sys.executable, "-m", "uvicorn",
        "backend.app.main:app",
        "--host", "0.0.0.0",
        "--port", "8080",
    ]
    backend_proc = subprocess.Popen(backend_cmd, cwd=PROJECT_ROOT)

    npm_bin = shutil.which("npm")
    frontend_dir = PROJECT_ROOT / "frontend"
    frontend_proc = None
    if npm_bin and (frontend_dir / "node_modules").exists():
        frontend_proc = subprocess.Popen([npm_bin, "run", "dev"], cwd=frontend_dir)

    print("WiFi-Radar started:")
    print("  Website (UI + 3D): http://localhost:3000")
    print("  Backend API:       http://localhost:8080")

    def shutdown(*_: object) -> None:
        for p in (frontend_proc, backend_proc):
            if p and p.poll() is None:
                p.terminate()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        backend_proc.wait()
    finally:
        shutdown()

    return 0


if __name__ == "__main__":
    sys.exit(main())
