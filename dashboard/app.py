"""
Lightweight Localhost Dashboard for WiFi-Radar ESP32 CSI Integration.

Serves a self-contained, beginner-friendly HTML/JS dashboard with an interactive
3D room & posture visualization at http://127.0.0.1:8000 (100% offline, no CDNs).
"""

from __future__ import annotations

from typing import Any, Dict

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse

from csi_logger.serial_logger import SerialCSILogger
from inference.live_inference import LiveCSIInferenceEngine

DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>WiFi-Radar · Home Safety Monitor</title>
<style>
  :root {
    --bg: #0b1120; --card: #131c31; --card-soft: #1a2540; --border: #263554;
    --text: #f8fafc; --muted: #94a3b8;
    --green: #22c55e; --red: #ef4444; --amber: #f59e0b; --blue: #38bdf8;
  }
  * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { margin: 0; background: var(--bg); color: var(--text); padding: 20px; max-width: 1200px; margin-inline: auto; }

  /* Top Hero Status Banner */
  .hero-banner {
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;
    padding: 18px 22px; border-radius: 14px; margin-bottom: 18px;
    background: var(--card); border: 2px solid var(--border);
    transition: border-color 0.3s, background 0.3s;
  }
  .hero-banner.ok { border-color: rgba(34,197,94,0.6); background: linear-gradient(135deg, #131c31, rgba(34,197,94,0.10)); }
  .hero-banner.warn { border-color: rgba(245,158,11,0.6); background: linear-gradient(135deg, #131c31, rgba(245,158,11,0.10)); }
  .hero-banner.danger { border-color: var(--red); background: linear-gradient(135deg, #2a1218, rgba(239,68,68,0.22)); animation: pulseBorder 1.2s infinite; }
  @keyframes pulseBorder { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.45); } 50% { box-shadow: 0 0 0 10px rgba(239,68,68,0); } }

  .hero-title { font-size: 1.4rem; font-weight: 700; margin: 0; }
  .hero-sub { color: var(--muted); font-size: 0.92rem; margin-top: 4px; }
  .pill { padding: 6px 14px; border-radius: 999px; font-size: 0.82rem; font-weight: 700; letter-spacing: 0.03em; }
  .pill.ok { background: rgba(34,197,94,0.18); color: var(--green); border: 1px solid var(--green); }
  .pill.warn { background: rgba(245,158,11,0.18); color: var(--amber); border: 1px solid var(--amber); }
  .pill.danger { background: rgba(239,68,68,0.25); color: #fecaca; border: 1px solid var(--red); }
  .pill.info { background: rgba(56,189,248,0.18); color: var(--blue); border: 1px solid var(--blue); }

  /* Main 2-column simple layout */
  .main-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 18px; }
  @media (max-width: 860px) { .main-grid { grid-template-columns: 1fr; } }

  .card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
  .card-title { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 0 0 12px 0; display: flex; justify-content: space-between; align-items: center; }

  /* 3D Room Canvas */
  #room3d { width: 100%; height: 340px; border-radius: 10px; background: radial-gradient(circle at 50% 35%, #182644, #090e1a); cursor: grab; display: block; }
  #room3d:active { cursor: grabbing; }
  .hint { font-size: 0.78rem; color: var(--muted); margin-top: 8px; text-align: center; }

  /* Simple Activity & Status Readout */
  .activity-box { background: var(--card-soft); border-radius: 12px; padding: 16px; margin-bottom: 14px; text-align: center; }
  .activity-emoji { font-size: 2.5rem; line-height: 1.1; }
  .activity-name { font-size: 1.65rem; font-weight: 700; margin: 6px 0 4px 0; }
  .activity-desc { font-size: 0.9rem; color: var(--muted); }

  .meter-label { display: flex; justify-content: space-between; font-size: 0.86rem; color: var(--muted); margin: 10px 0 5px; }
  .bar-wrap { background: #090e1a; border-radius: 999px; height: 10px; overflow: hidden; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, var(--blue), var(--green)); transition: width 0.3s; }

  .simple-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
  .stat-tile { background: var(--card-soft); padding: 12px; border-radius: 10px; }
  .stat-tile .k { font-size: 0.78rem; color: var(--muted); }
  .stat-tile .v { font-size: 1.05rem; font-weight: 700; margin-top: 3px; }

  .notice { margin-top: 12px; padding: 10px 12px; border-radius: 8px; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.5); color: #fde68a; font-size: 0.84rem; display: none; }

  /* Fall Events */
  .events-card { margin-top: 18px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
  th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--border); }
  th { color: var(--muted); font-weight: 600; }

  /* Collapsible Technical Details */
  details.tech { margin-top: 18px; background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 14px 18px; }
  details.tech summary { cursor: pointer; font-weight: 600; color: var(--muted); font-size: 0.92rem; }
  .tech-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-top: 14px; }
  .kv { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(51,65,85,0.45); font-size: 0.85rem; }
  #csiCanvas { width: 100%; height: 110px; background: #090e1a; border-radius: 8px; margin-top: 8px; }
</style>
</head>
<body>

  <!-- Simple Hero Status Banner -->
  <div id="heroBanner" class="hero-banner warn">
    <div>
      <h1 id="heroTitle" class="hero-title">Connecting to Home Sensor...</h1>
      <div id="heroSub" class="hero-sub">No cameras · Privacy-safe Wi-Fi sensing · Localhost only</div>
    </div>
    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
      <span id="modePill" class="pill info">HARDWARE LIVE</span>
      <span id="statePill" class="pill warn">WAITING</span>
    </div>
  </div>

  <!-- Main Easy-to-Understand Section -->
  <div class="main-grid">
    <!-- Interactive 3D Room View -->
    <div class="card">
      <div class="card-title">
        <span>3D Live Room View</span>
        <span style="font-size:0.78rem; color:var(--blue)">Interactive 3D</span>
      </div>
      <canvas id="room3d" width="640" height="340"></canvas>
      <div class="hint">Drag horizontally to rotate the 3D room · Wi-Fi waves show live sensor link</div>
    </div>

    <!-- Plain-English Current Activity -->
    <div class="card">
      <div class="card-title"><span>Current Activity</span></div>
      <div class="activity-box">
        <div id="actEmoji" class="activity-emoji">📡</div>
        <div id="actName" class="activity-name">Waiting for Signal</div>
        <div id="actDesc" class="activity-desc">Plug in the ESP32 sensor to begin monitoring.</div>
      </div>

      <div class="meter-label"><span>AI Confidence</span><strong id="confText">—</strong></div>
      <div class="bar-wrap"><div id="confBar" class="bar-fill" style="width:0%"></div></div>

      <div class="meter-label"><span>Signal Window Ready</span><strong id="bufText">0 / 200</strong></div>
      <div class="bar-wrap"><div id="bufBar" class="bar-fill" style="width:0%; background:var(--blue);"></div></div>

      <div class="simple-stats">
        <div class="stat-tile">
          <div class="k">Sensor Connection</div>
          <div id="sensorSimple" class="v">Disconnected</div>
        </div>
        <div class="stat-tile">
          <div class="k">Wi-Fi Signal</div>
          <div id="wifiSimple" class="v">—</div>
        </div>
      </div>

      <div id="friendlyNotice" class="notice"></div>
    </div>
  </div>

  <!-- Fall Alerts -->
  <div class="card events-card">
    <div class="card-title"><span>Fall Alerts History</span></div>
    <table>
      <thead>
        <tr><th>Time</th><th>Detected Event</th><th>Confidence</th><th>Verification</th><th>Alert Status</th></tr>
      </thead>
      <tbody id="eventsBody">
        <tr><td colspan="5" style="color:var(--muted)">No falls detected. Everything is safe.</td></tr>
      </tbody>
    </table>
  </div>

  <!-- Technical Details (Collapsible for Engineers / Presenters) -->
  <details class="tech">
    <summary>Technical Pipeline Details (ESP32 Serial · JSONL Dataset · Subcarriers)</summary>
    <div class="tech-grid">
      <div>
        <div class="kv"><span>COM Port / Baud</span><strong id="comPort">—</strong></div>
        <div class="kv"><span>ESP32 IP / Channel</span><strong id="ipChan">—</strong></div>
        <div class="kv"><span>Packet Rate</span><strong id="hzRate">0 Hz</strong></div>
        <div class="kv"><span>Last Packet</span><strong id="lastPkt">—</strong></div>
      </div>
      <div>
        <div class="kv"><span>Records Received</span><strong id="recRecv">0</strong></div>
        <div class="kv"><span>Saved (csi_live.jsonl)</span><strong id="recSaved">0</strong></div>
        <div class="kv"><span>Processed by ML</span><strong id="recProc">0</strong></div>
        <div class="kv"><span>Invalid / Dropped</span><strong id="recInv">0</strong></div>
      </div>
      <div>
        <div class="kv"><span>RSSI / Noise Floor</span><strong id="rssiNoise">—</strong></div>
        <div class="kv"><span>Inference Status</span><strong id="infStatus">—</strong></div>
        <canvas id="csiCanvas" width="320" height="110"></canvas>
      </div>
    </div>
  </details>

<script>
// ===================== 3D ROOM RENDERER (ZERO-DEPENDENCY) =====================
const canvas3d = document.getElementById('room3d');
const ctx3d = canvas3d.getContext('2d');
let yaw = 0.65;
let pitch = 0.42;
let dragging = false;
let lastX = 0;

canvas3d.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; });
window.addEventListener('mouseup', () => { dragging = false; });
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  yaw += (e.clientX - lastX) * 0.008;
  lastX = e.clientX;
});

let currentState = 'INSUFFICIENT_DATA';
let currentActivity = 'stand';
let wifiActive = false;

function project(x, y, z) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const rx = x * cy - z * sy;
  const rz = x * sy + z * cy;
  const ry = y * cp - rz * sp;
  const fz = y * sp + rz * cp + 7.2;
  const scale = 330 / Math.max(fz, 1.5);
  return [canvas3d.width / 2 + rx * scale, canvas3d.height / 2 + 30 - ry * scale, fz];
}

function drawLine3D(a, b, color, width = 1.5) {
  const p1 = project(a[0], a[1], a[2]);
  const p2 = project(b[0], b[1], b[2]);
  ctx3d.strokeStyle = color;
  ctx3d.lineWidth = width;
  ctx3d.beginPath();
  ctx3d.moveTo(p1[0], p1[1]);
  ctx3d.lineTo(p2[0], p2[1]);
  ctx3d.stroke();
}

function drawJoint(p, r, color) {
  const pt = project(p[0], p[1], p[2]);
  ctx3d.fillStyle = color;
  ctx3d.beginPath();
  ctx3d.arc(pt[0], pt[1], r, 0, Math.PI * 2);
  ctx3d.fill();
}

function render3D(nowMs) {
  const t = nowMs * 0.001;
  ctx3d.clearRect(0, 0, canvas3d.width, canvas3d.height);

  // Floor grid (-2.4 to +2.4)
  for (let i = -2; i <= 2; i++) {
    drawLine3D([i * 1.1, 0, -2.2], [i * 1.1, 0, 2.2], 'rgba(56,189,248,0.16)', 1);
    drawLine3D([-2.2, 0, i * 1.1], [2.2, 0, i * 1.1], 'rgba(56,189,248,0.16)', 1);
  }
  // Room back walls
  drawLine3D([-2.2, 0, -2.2], [-2.2, 2.2, -2.2], 'rgba(148,163,184,0.28)', 1.5);
  drawLine3D([2.2, 0, -2.2], [2.2, 2.2, -2.2], 'rgba(148,163,184,0.28)', 1.5);
  drawLine3D([-2.2, 2.2, -2.2], [2.2, 2.2, -2.2], 'rgba(148,163,184,0.28)', 1.5);

  // Router on back-left wall & ESP32 on back-right wall
  const routerPos = [-1.8, 1.3, -2.0];
  const espPos = [1.8, 1.1, -2.0];
  drawJoint(routerPos, 6, '#38bdf8');
  drawJoint(espPos, 6, wifiActive ? '#22c55e' : '#f59e0b');

  // Label router & ESP32
  const rp = project(...routerPos);
  const ep = project(...espPos);
  ctx3d.fillStyle = '#94a3b8';
  ctx3d.font = '11px sans-serif';
  ctx3d.fillText('Wi-Fi Router', rp[0] - 28, rp[1] - 12);
  ctx3d.fillText('ESP32 Sensor', ep[0] - 32, ep[1] - 12);

  // Animated Wi-Fi signal arc between Router & ESP32
  if (wifiActive) {
    const pulse = (t * 1.5) % 1;
    const wx = routerPos[0] + (espPos[0] - routerPos[0]) * pulse;
    const wy = routerPos[1] + Math.sin(pulse * Math.PI) * 0.25;
    drawJoint([wx, wy, -2.0], 3.5, 'rgba(56,189,248,0.85)');
    drawLine3D(routerPos, espPos, 'rgba(56,189,248,0.22)', 1.2);
  }

  // 3D Person posture based on live activity / state
  const isFall = currentState === 'POTENTIAL_FALL' || currentActivity === 'fall';
  const isOnline = currentState === 'NORMAL_MONITORING' || currentState === 'POTENTIAL_FALL';
  const bodyColor = isFall ? '#ef4444' : isOnline ? '#22c55e' : 'rgba(148,163,184,0.45)';

  if (isFall) {
    // Fallen person lying on floor + pulsing red ring
    const ringR = 0.55 + Math.sin(t * 6) * 0.12;
    for (let a = 0; a < 16; a++) {
      const a1 = (a / 16) * Math.PI * 2;
      const a2 = ((a + 1) / 16) * Math.PI * 2;
      drawLine3D([Math.cos(a1) * ringR, 0.02, Math.sin(a1) * ringR],
                 [Math.cos(a2) * ringR, 0.02, Math.sin(a2) * ringR], 'rgba(239,68,68,0.75)', 2);
    }
    drawJoint([-0.55, 0.16, 0.1], 9, bodyColor); // Head
    drawLine3D([-0.42, 0.14, 0.1], [0.25, 0.12, 0.05], bodyColor, 4); // Torso
    drawLine3D([0.25, 0.12, 0.05], [0.72, 0.08, 0.25], bodyColor, 3); // Leg 1
    drawLine3D([0.25, 0.12, 0.05], [0.68, 0.08, -0.18], bodyColor, 3); // Leg 2
  } else if (currentActivity === 'sit') {
    // Sitting / resting posture
    const sway = Math.sin(t * 2) * 0.02;
    drawJoint([0, 1.05 + sway, 0], 9, bodyColor);
    drawLine3D([0, 0.95 + sway, 0], [0, 0.48, 0], bodyColor, 4);
    drawLine3D([0, 0.48, 0], [0.35, 0.45, 0.15], bodyColor, 3);
    drawLine3D([0.35, 0.45, 0.15], [0.35, 0.02, 0.15], bodyColor, 3);
    drawLine3D([0, 0.48, 0], [0.35, 0.45, -0.15], bodyColor, 3);
    drawLine3D([0.35, 0.45, -0.15], [0.35, 0.02, -0.15], bodyColor, 3);
  } else {
    // Standing / Walking / Jumping
    const isWalk = currentActivity === 'walk';
    const isJump = currentActivity === 'Jump';
    const px = isWalk ? Math.sin(t * 1.4) * 0.75 : 0;
    const py = isJump ? Math.abs(Math.sin(t * 4.5)) * 0.45 : 0;
    const stride = isWalk ? Math.sin(t * 5) * 0.28 : 0;

    drawJoint([px, 1.55 + py, 0], 9, bodyColor); // Head
    drawLine3D([px, 1.44 + py, 0], [px, 0.85 + py, 0], bodyColor, 4); // Torso
    drawLine3D([px, 1.30 + py, 0], [px - stride * 0.8, 0.95 + py, 0.22], bodyColor, 2.5); // Arm L
    drawLine3D([px, 1.30 + py, 0], [px + stride * 0.8, 0.95 + py, -0.22], bodyColor, 2.5); // Arm R
    drawLine3D([px, 0.85 + py, 0], [px + stride, 0.02 + py, 0.14], bodyColor, 3); // Leg L
    drawLine3D([px, 0.85 + py, 0], [px - stride, 0.02 + py, -0.14], bodyColor, 3); // Leg R
  }

  requestAnimationFrame(render3D);
}
requestAnimationFrame(render3D);

// ===================== DASHBOARD DATA POLLING =====================
const ACTIVITY_INFO = {
  walk:  { emoji: '🚶', name: 'Walking', desc: 'Person is moving normally around the room.' },
  stand: { emoji: '🧍', name: 'Standing', desc: 'Person is standing upright.' },
  sit:   { emoji: '🛋️', name: 'Sitting / Resting', desc: 'Person is resting calmly.' },
  Jump:  { emoji: '⬆️', name: 'Sudden Movement', desc: 'Fast vertical motion detected.' },
  fall:  { emoji: '🚨', name: 'Fall Detected!', desc: 'Possible fall — please check on the person immediately.' },
};

function signalBars(rssi) {
  if (rssi === null || rssi === undefined) return '—';
  if (rssi >= -55) return 'Strong (' + rssi + ' dBm)';
  if (rssi >= -70) return 'Good (' + rssi + ' dBm)';
  return 'Weak (' + rssi + ' dBm)';
}

function drawSubcarriers(amps) {
  const c = document.getElementById('csiCanvas');
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  if (!amps || amps.length === 0) return;
  const maxV = Math.max(...amps, 1);
  const w = c.width / amps.length;
  ctx.fillStyle = '#38bdf8';
  amps.forEach((v, i) => {
    const h = (v / maxV) * (c.height - 10);
    ctx.fillRect(i * w + 1, c.height - h - 4, Math.max(w - 2, 2), h);
  });
}

async function poll() {
  try {
    const res = await fetch('/api/status');
    const d = await res.json();
    const log = d.logger;
    const inf = d.inference;

    currentState = inf.system_state;
    currentActivity = inf.predicted_label || 'stand';
    wifiActive = Boolean(log.wifi_connected);

    // Hero Banner
    const hero = document.getElementById('heroBanner');
    const heroTitle = document.getElementById('heroTitle');
    const statePill = document.getElementById('statePill');
    const modePill = document.getElementById('modePill');

    modePill.textContent = log.mode === 'DATA_REPLAY' ? 'REPLAY MODE' : 'HARDWARE LIVE';
    modePill.className = log.mode === 'DATA_REPLAY' ? 'pill warn' : 'pill info';

    if (inf.system_state === 'POTENTIAL_FALL') {
      hero.className = 'hero-banner danger';
      heroTitle.textContent = 'ALERT: Possible Fall Detected!';
      statePill.className = 'pill danger';
      statePill.textContent = 'FALL ALERT';
    } else if (inf.system_state === 'NORMAL_MONITORING') {
      hero.className = 'hero-banner ok';
      heroTitle.textContent = 'Everything Looks Normal';
      statePill.className = 'pill ok';
      statePill.textContent = 'SAFE · MONITORING';
    } else {
      hero.className = 'hero-banner warn';
      heroTitle.textContent = inf.system_state === 'MODEL_NOT_FOUND'
        ? 'AI Model Needs Training First'
        : 'Waiting for Live Sensor Data...';
      statePill.className = 'pill warn';
      statePill.textContent = inf.system_state.replaceAll('_', ' ');
    }

    // Simple Activity Card
    const info = ACTIVITY_INFO[inf.predicted_label] || null;
    if (inf.system_state === 'NORMAL_MONITORING' || inf.system_state === 'POTENTIAL_FALL') {
      document.getElementById('actEmoji').textContent = info ? info.emoji : '📡';
      document.getElementById('actName').textContent = info ? info.name : (inf.predicted_display || 'Monitoring');
      document.getElementById('actDesc').textContent = info ? info.desc : 'Live activity classification active.';
    } else if (inf.system_state === 'INSUFFICIENT_DATA') {
      document.getElementById('actEmoji').textContent = '⏳';
      document.getElementById('actName').textContent = 'Collecting Signal...';
      document.getElementById('actDesc').textContent = `Need ${inf.window_size} packets before first prediction.`;
    } else if (inf.system_state === 'MODEL_NOT_FOUND') {
      document.getElementById('actEmoji').textContent = '🧠';
      document.getElementById('actName').textContent = 'Model Not Loaded';
      document.getElementById('actDesc').textContent = 'Run python ai/train_activity_classifier.py once.';
    } else {
      document.getElementById('actEmoji').textContent = '🔌';
      document.getElementById('actName').textContent = 'Sensor Offline';
      document.getElementById('actDesc').textContent = 'Connect the ESP32-WROOM-32 via USB to start.';
    }

    document.getElementById('confText').textContent = inf.confidence !== null ? `${(inf.confidence * 100).toFixed(0)}%` : '—';
    document.getElementById('confBar').style.width = inf.confidence !== null ? `${(inf.confidence * 100).toFixed(0)}%` : '0%';
    document.getElementById('bufText').textContent = `${inf.buffer_fill} / ${inf.window_size}`;
    document.getElementById('bufBar').style.width = `${Math.min(100, (inf.buffer_fill / inf.window_size) * 100)}%`;

    document.getElementById('sensorSimple').textContent = log.esp32_connected ? 'Connected' : 'Not Connected';
    document.getElementById('wifiSimple').textContent = signalBars(log.last_rssi);

    const notice = document.getElementById('friendlyNotice');
    const warnMsg = inf.model_error || inf.compatibility_warning || log.last_error;
    if (warnMsg) {
      notice.style.display = 'block';
      notice.textContent = warnMsg;
    } else {
      notice.style.display = 'none';
    }

    // Events Table
    const tbody = document.getElementById('eventsBody');
    if (inf.recent_events && inf.recent_events.length > 0) {
      tbody.innerHTML = inf.recent_events.map(ev => `
        <tr>
          <td>${ev.timestamp}</td>
          <td><strong>${ev.display_activity || ev.activity}</strong></td>
          <td>${(ev.confidence * 100).toFixed(0)}%</td>
          <td>${ev.validation_status}</td>
          <td>${ev.alert_status}</td>
        </tr>
      `).join('');
    }

    // Technical Details
    document.getElementById('comPort').textContent = `${log.com_port} @ ${log.baud_rate}`;
    document.getElementById('ipChan').textContent = `${log.esp32_ip || '—'} · Ch ${log.last_channel ?? '—'}`;
    document.getElementById('hzRate').textContent = `${log.effective_hz} Hz`;
    document.getElementById('lastPkt').textContent = log.last_packet_at ? log.last_packet_at.split('T')[1].slice(0, 12) : 'None';
    document.getElementById('recRecv').textContent = log.records_received;
    document.getElementById('recSaved').textContent = log.records_saved;
    document.getElementById('recProc').textContent = inf.records_processed;
    document.getElementById('recInv').textContent = `${log.invalid_records} / ${log.dropped_on_esp32}`;
    document.getElementById('rssiNoise').textContent = log.last_rssi !== null ? `${log.last_rssi} / ${log.last_noise_floor ?? '—'} dBm` : '—';
    document.getElementById('infStatus').textContent = inf.inference_status;
    drawSubcarriers(log.last_amplitudes);
  } catch (e) {
    // ignore transient poll errors
  }
}

poll();
setInterval(poll, 500);
</script>
</body>
</html>
"""


def create_dashboard_app(
    logger_svc: SerialCSILogger,
    inference_svc: LiveCSIInferenceEngine,
) -> FastAPI:
    """Create FastAPI localhost dashboard bound to the live logger and inference services."""
    app = FastAPI(title="WiFi-Radar Local CSI Dashboard", version="1.0.0")

    @app.get("/", response_class=HTMLResponse)
    async def index() -> str:
        return DASHBOARD_HTML

    @app.get("/health")
    async def health() -> Dict[str, Any]:
        return {
            "status": "healthy",
            "mode": logger_svc.status["mode"],
            "model_loaded": inference_svc.model_loaded,
        }

    @app.get("/api/status")
    async def status() -> JSONResponse:
        return JSONResponse({
            "logger": logger_svc.status,
            "inference": inference_svc.status,
        })

    @app.get("/api/events")
    async def events() -> JSONResponse:
        return JSONResponse({"events": inference_svc.get_recent_events(limit=50)})

    return app
