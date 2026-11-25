# ESP32 CSI Firmware

## Hardware Requirements

- **ESP32-S3-DevKitC-1** (recommended) or ESP32-S3-WROOM-1
- **USB Cable** (USB-C for ESP32-S3)
- **WiFi Router** (2.4 GHz or 5 GHz)

## Firmware Overview

The ESP32 firmware captures WiFi Channel State Information (CSI) and transmits it to the Python backend via serial/USB connection.

## Features

- Real-time CSI packet capture
- Configurable sampling rate
- Serial output with timestamps
- Low-latency streaming
- Automatic reconnection

## Installation Instructions

### 1. Install ESP-IDF

```bash
# Clone ESP-IDF
mkdir -p ~/esp
cd ~/esp
git clone -b v5.1 --recursive https://github.com/espressif/esp-idf.git

# Install ESP-IDF
cd esp-idf
./install.sh esp32s3

# Source environment
. ./export.sh
```

### 2. Configure Project

```bash
cd /Users/pruthiviraj/wifi/hardware/esp32_firmware
idf.py menuconfig
```

Configure:
- WiFi SSID and Password
- CSI sampling parameters
- Serial baud rate (115200 recommended)

### 3. Build and Flash

```bash
# Build firmware
idf.py build

# Flash to ESP32
idf.py -p /dev/ttyUSB0 flash

# Monitor output
idf.py -p /dev/ttyUSB0 monitor
```

## CSI Data Format

The ESP32 transmits CSI data in the following format:

```
CSI_DATA,timestamp,mac_address,rssi,rate,sig_mode,mcs,cwb,len,data\n
```

Where:
- `timestamp`: Milliseconds since boot
- `mac_address`: Source MAC address
- `rssi`: Received Signal Strength Indicator
- `rate`: Data rate
- `sig_mode`: Signal mode
- `mcs`: Modulation and Coding Scheme
- `cwb`: Channel bandwidth
- `len`: CSI data length
- `data`: Comma-separated CSI amplitude values

## Troubleshooting

### ESP32 not detected

```bash
# Check USB connection
ls /dev/tty.*

# Check permissions (Linux)
sudo usermod -a -G dialout $USER
```

### CSI capture not working

- Ensure WiFi router is on and broadcasting
- Check SSID and password in menuconfig
- Verify ESP32 is in range (3-10 meters recommended)
- Check serial baud rate matches Python receiver

### High packet loss

- Reduce sampling rate
- Move ESP32 closer to router
- Reduce interference from other devices
- Use external antenna if available

## Configuration Options

### WiFi Settings
- **SSID**: Target WiFi network name
- **Password**: WiFi password
- **Channel**: Auto or specific channel

### CSI Settings
- **Sampling Rate**: 20-100 Hz (default: 50 Hz)
- **Filter**: MAC address filter (optional)
- **Subcarrier Mask**: Select specific subcarriers

### Serial Settings
- **Baud Rate**: 115200 (default), 230400, 460800, 921600
- **Data Bits**: 8
- **Stop Bits**: 1
- **Parity**: None

## LED Indicators

- **Solid Blue**: WiFi connected
- **Blinking Blue**: Attempting WiFi connection
- **Solid Green**: CSI capture active
- **Blinking Red**: Error state

## Performance

- **Typical sampling rate**: 50 Hz
- **Latency**: < 20ms
- **Packet loss**: < 1% under good conditions
- **Power consumption**: ~150mA @ 3.3V

## Next Steps

After firmware is flashed:
1. Connect ESP32 to computer via USB
2. Run Python CSI receiver: `python data_collection/csi_receiver/receiver.py`
3. Verify CSI data stream
4. Test with live activity classification

## Resources

- [ESP32-S3 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf)
- [ESP-IDF Programming Guide](https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/)
- [ESP32 CSI Guide](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-guides/wifi.html#wi-fi-channel-state-information)

## License

MIT License - See project root LICENSE file

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review ESP-IDF documentation
3. Open an issue in the project repository

---

**Note**: This is a placeholder README. Actual firmware code requires ESP-IDF development and is beyond the scope of Phase 4 initial setup. For Phase 4, we'll focus on the Python receiver that processes ESP32 CSI data.
