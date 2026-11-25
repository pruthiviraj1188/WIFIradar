# ESP32-WROOM-32 CSI Receiver Firmware

## Flashing Instructions (Arduino IDE on Windows 10/11)

1. Open **Arduino IDE** (2.x recommended).
2. Install **esp32** by Espressif Systems via **Boards Manager** (tested with `2.0.x` and `3.0.x`).
3. Select **Tools → Board → ESP32 Arduino → ESP32 Dev Module**.
4. Set **Tools → Upload Speed → 921600** (or `115200` if your USB-UART chip has issues).
5. Select your Windows **COM port** under **Tools → Port** (e.g. `COM3`).
6. Open `esp32/csi_receiver/csi_receiver.ino` and update:
   - `WIFI_SSID` (must be a **2.4 GHz** network — ESP32-WROOM-32 does not support 5 GHz)
   - `WIFI_PASSWORD`
   - `PING_INTERVAL_MS` (default `20` ms for ~50 Hz packet rate)
7. Click **Upload**.
8. Open **Serial Monitor** at **921600 baud** to verify JSONL output (`{"type":"status",...}` and `{"type":"csi",...}`). Close Serial Monitor before running `python main.py` so the COM port is free.

## Hardware-Specific Notes & Limitations

- **2.4 GHz only**: ESP32-WROOM-32 only supports 802.11b/g/n on 2.4 GHz.
- **I/Q format**: `iq` contains signed 8-bit integers `[imag0, real0, imag1, real1, ...]` as provided by `wifi_csi_info_t::buf`. Amplitude and phase are computed in Python (`csi_logger/serial_logger.py`) to keep serial bandwidth low.
- **Baud rate**: `921600` baud is used because JSONL CSI packets (~450 bytes each) at 50 Hz require ~22.5 KB/s (~225 kbps), which exceeds `115200` baud.
- **Status**: Firmware code is provided and ready to flash; physical hardware flashing/capture is **untested** without a connected ESP32-WROOM-32 board.
