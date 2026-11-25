/*
 * WiFi-Radar: ESP32-WROOM-32 CSI Receiver Firmware (Arduino IDE)
 * ===============================================================
 * Captures Wi-Fi Channel State Information (CSI) from a 2.4 GHz router
 * using an ESP32-WROOM-32 and streams JSON Lines over USB Serial.
 *
 * Hardware:
 *   - Board: ESP32-WROOM-32 (ESP32 Dev Module in Arduino IDE)
 *   - Core:  arduino-esp32 >= 2.0.x (tested for 2.0.x and 3.0.x APIs)
 *   - Baud:  921600 bps (required for sustained 20-50 Hz CSI JSONL output)
 *
 * Ping Mechanism:
 *   - Uses ESP32-initiated UDP/ICMP-style traffic to the router gateway
 *     at a configurable interval so the router replies with 802.11 frames
 *     that trigger the ESP32 CSI RX callback.
 *
 * Reliability:
 *   - CSI RX callback is non-blocking: copies raw I/Q + metadata into a
 *     fixed FreeRTOS queue and returns immediately.
 *   - Dedicated loop() task drains the queue and writes JSONL to Serial.
 *   - Automatic Wi-Fi reconnection on disconnect.
 */

#include <WiFi.h>
#include <WiFiUdp.h>
#include "esp_wifi.h"
#include "esp_wifi_types.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"

// ===================== USER CONFIGURATION =====================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Serial baud rate (must match csi_logger/config.json)
const unsigned long SERIAL_BAUD = 921600;

// Ping-to-router interval in milliseconds (20 ms = ~50 Hz target)
// Adjust between 20 ms (50 Hz) and 100 ms (10 Hz) as needed.
const unsigned long PING_INTERVAL_MS = 20;

// Queue capacity for CSI packets (prevents blocking inside callback)
#define CSI_QUEUE_LEN 16
#define MAX_CSI_BYTES 256
// ==============================================================

typedef struct {
  uint32_t timestamp_ms;
  uint32_t seq_num;
  int8_t   rssi;
  int8_t   noise_floor;
  uint8_t  channel;
  uint8_t  sig_mode;
  uint8_t  mcs;
  uint8_t  cwb;
  uint16_t csi_len;
  uint8_t  mac[6];
  int8_t   raw_iq[MAX_CSI_BYTES];
} csi_packet_t;

static QueueHandle_t csi_queue = nullptr;
static volatile uint32_t g_seq_num = 0;
static volatile uint32_t g_dropped_packets = 0;
static volatile bool g_csi_enabled = false;

WiFiUDP udp;
unsigned long last_ping_ms = 0;
unsigned long last_status_ms = 0;
unsigned long last_reconnect_ms = 0;

// Non-blocking CSI RX callback (runs in Wi-Fi task context)
void wifi_csi_rx_cb(void* ctx, wifi_csi_info_t* info) {
  if (!info || !info->buf || info->len <= 0 || !csi_queue) {
    return;
  }

  csi_packet_t pkt;
  pkt.timestamp_ms = millis();
  pkt.seq_num = ++g_seq_num;
  pkt.rssi = info->rx_ctrl.rssi;
  pkt.noise_floor = info->rx_ctrl.noise_floor;
  pkt.channel = info->rx_ctrl.channel;
  pkt.sig_mode = info->rx_ctrl.sig_mode;
  pkt.mcs = info->rx_ctrl.mcs;
  pkt.cwb = info->rx_ctrl.cwb;
  pkt.csi_len = (info->len > MAX_CSI_BYTES) ? MAX_CSI_BYTES : info->len;
  memcpy(pkt.mac, info->mac, 6);
  memcpy(pkt.raw_iq, info->buf, pkt.csi_len);

  if (xQueueSend(csi_queue, &pkt, 0) != pdTRUE) {
    g_dropped_packets++;
  }
}

void configure_csi() {
  wifi_csi_config_t csi_config;
  memset(&csi_config, 0, sizeof(csi_config));
  csi_config.lltf_en           = true;
  csi_config.htltf_en          = true;
  csi_config.stbc_htltf2_en    = true;
  csi_config.ltf_merge_en      = true;
  csi_config.channel_filter_en = true;
  csi_config.manu_scale        = false;
  csi_config.shift             = false;

  esp_err_t err = esp_wifi_set_csi_config(&csi_config);
  if (err != ESP_OK) {
    Serial.printf("{\"type\":\"error\",\"msg\":\"esp_wifi_set_csi_config failed: %d\"}\n", err);
    return;
  }

  err = esp_wifi_set_csi_rx_cb(&wifi_csi_rx_cb, nullptr);
  if (err != ESP_OK) {
    Serial.printf("{\"type\":\"error\",\"msg\":\"esp_wifi_set_csi_rx_cb failed: %d\"}\n", err);
    return;
  }

  err = esp_wifi_set_csi(true);
  if (err != ESP_OK) {
    Serial.printf("{\"type\":\"error\",\"msg\":\"esp_wifi_set_csi failed: %d\"}\n", err);
    return;
  }

  g_csi_enabled = true;
  Serial.println("{\"type\":\"status\",\"event\":\"csi_enabled\",\"board\":\"ESP32-WROOM-32\"}");
}

void connect_wifi() {
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);  // Disable Wi-Fi power saving for consistent CSI capture
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.printf("{\"type\":\"status\",\"event\":\"wifi_connecting\",\"ssid\":\"%s\"}\n", WIFI_SSID);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(250);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf(
      "{\"type\":\"status\",\"event\":\"wifi_connected\",\"ip\":\"%s\",\"gateway\":\"%s\",\"channel\":%d,\"rssi\":%d}\n",
      WiFi.localIP().toString().c_str(),
      WiFi.gatewayIP().toString().c_str(),
      WiFi.channel(),
      WiFi.RSSI()
    );
    configure_csi();
  } else {
    Serial.println("{\"type\":\"status\",\"event\":\"wifi_connect_failed\"}");
  }
}

void send_router_ping() {
  // Send a lightweight UDP probe to the router gateway (port 33434).
  // The router's 802.11 ACK / ICMP unreachable reply triggers CSI on the ESP32.
  IPAddress gw = WiFi.gatewayIP();
  if (gw[0] == 0) return;
  udp.beginPacket(gw, 33434);
  udp.print("CSI_PING");
  udp.endPacket();
}

void emit_csi_json(const csi_packet_t& pkt) {
  // Stream compact JSONL: raw I/Q array + metadata.
  // Python logger computes amplitude & phase from raw_iq to minimize serial overhead.
  Serial.print("{\"type\":\"csi\",\"ts_ms\":");
  Serial.print(pkt.timestamp_ms);
  Serial.print(",\"seq\":");
  Serial.print(pkt.seq_num);
  Serial.print(",\"rssi\":");
  Serial.print(pkt.rssi);
  Serial.print(",\"noise_floor\":");
  Serial.print(pkt.noise_floor);
  Serial.print(",\"channel\":");
  Serial.print(pkt.channel);
  Serial.print(",\"sig_mode\":");
  Serial.print(pkt.sig_mode);
  Serial.print(",\"mcs\":");
  Serial.print(pkt.mcs);
  Serial.print(",\"cwb\":");
  Serial.print(pkt.cwb);
  Serial.print(",\"csi_len\":");
  Serial.print(pkt.csi_len);
  Serial.printf(",\"mac\":\"%02X:%02X:%02X:%02X:%02X:%02X\"",
                pkt.mac[0], pkt.mac[1], pkt.mac[2], pkt.mac[3], pkt.mac[4], pkt.mac[5]);
  Serial.print(",\"valid\":");
  Serial.print((pkt.csi_len >= 4) ? "true" : "false");
  Serial.print(",\"iq\":[");
  for (uint16_t i = 0; i < pkt.csi_len; i++) {
    if (i > 0) Serial.print(',');
    Serial.print(pkt.raw_iq[i]);
  }
  Serial.println("]}");
}

void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(500);

  csi_queue = xQueueCreate(CSI_QUEUE_LEN, sizeof(csi_packet_t));
  if (!csi_queue) {
    Serial.println("{\"type\":\"error\",\"msg\":\"Failed to create CSI queue\"}");
  }

  Serial.println("{\"type\":\"status\",\"event\":\"boot\",\"firmware\":\"wifi-radar-esp32-wroom-32\"}");
  connect_wifi();
}

void loop() {
  unsigned long now = millis();

  // Handle Wi-Fi disconnection & auto-reconnect
  if (WiFi.status() != WL_CONNECTED) {
    g_csi_enabled = false;
    if (now - last_reconnect_ms >= 5000) {
      last_reconnect_ms = now;
      Serial.println("{\"type\":\"status\",\"event\":\"wifi_disconnected_reconnecting\"}");
      WiFi.disconnect();
      connect_wifi();
    }
    return;
  }

  // Periodic ESP32-to-router probe to sustain CSI packet flow
  if (g_csi_enabled && (now - last_ping_ms >= PING_INTERVAL_MS)) {
    last_ping_ms = now;
    send_router_ping();
  }

  // Drain CSI queue and transmit over USB Serial
  csi_packet_t pkt;
  int processed = 0;
  while (csi_queue && xQueueReceive(csi_queue, &pkt, 0) == pdTRUE && processed < 8) {
    emit_csi_json(pkt);
    processed++;
  }

  // Periodic heartbeat with drop count
  if (now - last_status_ms >= 5000) {
    last_status_ms = now;
    Serial.printf(
      "{\"type\":\"heartbeat\",\"ts_ms\":%lu,\"ip\":\"%s\",\"rssi\":%d,\"channel\":%d,\"seq\":%lu,\"dropped\":%lu}\n",
      now,
      WiFi.localIP().toString().c_str(),
      WiFi.RSSI(),
      WiFi.channel(),
      (unsigned long)g_seq_num,
      (unsigned long)g_dropped_packets
    );
  }
}
