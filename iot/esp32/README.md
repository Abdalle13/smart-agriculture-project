# ESP32 Soil Probe — AgriSense IoT Firmware

This folder contains the Arduino sketch for the AgriSense ESP32 soil monitoring probe deployed in Afgoye District, Somalia. The device reads NPK levels, soil moisture, air temperature, and humidity, then posts the data to the AgriSense backend every 30 seconds.

---

## Hardware Components

| Component          | Module              | Purpose                              |
|--------------------|---------------------|--------------------------------------|
| ESP32              | ESP32 DevKit v1     | Main microcontroller + WiFi          |
| DHT11              | DHT11               | Air temperature & humidity           |
| Soil Moisture      | Capacitive v1.2     | Soil moisture percentage             |
| NPK Sensor         | RS485 Modbus        | Nitrogen, Phosphorus, Potassium      |
| MAX485             | MAX485 module       | RS485 to UART signal converter       |

---

## Pin Wiring

### DHT11 — Air Temperature & Humidity
| DHT11 Pin | ESP32 Pin |
|-----------|-----------|
| VCC       | 3.3V      |
| GND       | GND       |
| DATA      | GPIO 14   |

### Soil Moisture Sensor (Analog)
| Sensor Pin | ESP32 Pin |
|------------|-----------|
| VCC        | 3.3V      |
| GND        | GND       |
| AOUT       | GPIO 34   |

### MAX485 Module (RS485 → UART)
| MAX485 Pin | ESP32 Pin |
|------------|-----------|
| VCC        | 5V        |
| GND        | GND       |
| DE         | GPIO 19   |
| RE         | GPIO 4    |
| RO (RX)    | GPIO 16   |
| DI (TX)    | GPIO 17   |

### NPK Sensor → MAX485
| NPK Pin | MAX485 Pin |
|---------|------------|
| A+      | A          |
| B-      | B          |
| VCC     | 12V        |
| GND     | GND        |

---

## Calibration

### Soil Moisture Sensor
The sensor outputs a raw analog value (0–4095). The sketch maps it to a 0–100% range:
- **Dry / in air:** raw ≈ 4095 → 0%
- **Submerged in water:** raw ≈ 1200 → 100%
- Formula: `map(rawValue, 4095, 1200, 0, 100)`

### NPK Sensor (Modbus RTU)
| Setting          | Value    |
|------------------|----------|
| Slave ID         | 1        |
| Baud Rate        | 9600     |
| Register Address | `0x001E` |
| Register 0       | Nitrogen (mg/kg)    |
| Register 1       | Phosphorus (mg/kg)  |
| Register 2       | Potassium (mg/kg)   |

---

## Flash Instructions

### Step 1 — Install Arduino IDE
Download and install **Arduino IDE 2.x** from https://www.arduino.cc/en/software

### Step 2 — Add ESP32 Board Support
1. Open `File → Preferences`
2. Paste this URL into **Additional Board Manager URLs**:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Go to `Tools → Board → Board Manager`, search **esp32**, and click Install

### Step 3 — Install Required Libraries
Go to `Sketch → Include Library → Manage Libraries` and install:
- `DHT sensor library` — by Adafruit
- `Adafruit Unified Sensor` — by Adafruit
- `ModbusMaster` — by Doc Walker

### Step 4 — Configure WiFi and Server IP
Open `esp32.ino` and update these two lines near the top:

```cpp
const char* ssid     = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
```

```cpp
String serverName = "http://192.168.X.X:5000/api/sensors/readings";
```

If you're flashing **more than one probe**, also update the hardcoded sensor ID further down in the file (in the JSON payload construction) so each device reports under its own node — otherwise every probe will submit readings as the same node and overwrite each other's data:

```cpp
json += "\"sensorId\":\"s002\",";   // change to the node ID registered for this probe (s001, s003, ...)
```

The backend accepts readings for any `sensorId` string without checking it against the registry — but the reading won't show up anywhere meaningful in the dashboard unless that ID matches a node already registered (seeded via `node seed.js`, or created by an admin in the Field Nodes page).

To find your PC's IP address, run in terminal:
```
ipconfig        # Windows
ifconfig        # Linux / macOS
```
Look for **IPv4 Address** under your WiFi adapter (e.g. `192.168.100.182`).

### Step 5 — Select Board and Port
- Connect the ESP32 via USB
- `Tools → Board → ESP32 Dev Module`
- `Tools → Port → COM? (select your ESP32 port)`

### Step 6 — Upload
Click **Verify (✔)** to compile, then **Upload (→)** to flash.

> If it gets stuck on `Connecting...`, hold the **BOOT** button on the ESP32 while uploading.

### Step 7 — Verify with Serial Monitor
Open `Tools → Serial Monitor` and set baud rate to **115200**.
You should see WiFi connection logs followed by:
```
HTTP Response code: 201
```
This confirms the probe is sending data to the backend successfully.

---

## API Endpoint

The sketch posts to:
```
POST http://<YOUR_PC_IP>:5000/api/sensors/readings
```

Example payload sent every 30 seconds (`sensorId` is hardcoded to `s002` in the sketch — see Step 4):
```json
{
  "sensorId":    "s002",
  "temperature": 29.3,
  "humidity":    58.0,
  "moisture":    42.0,
  "nitrogen":    87,
  "phosphorus":  34,
  "potassium":   142
}
```

A successful response returns HTTP `201 Created`.

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Stuck on `Connecting....` during upload | ESP32 didn't enter bootloader mode in time | Hold the **BOOT** button as soon as Arduino IDE starts uploading, release once it begins writing |
| `A fatal error occurred: Failed to connect to ESP32` | Wrong COM port, or USB driver not installed | Install the CP2102 or CH340 USB driver (check your board), reselect `Tools → Port` |
| Serial Monitor shows garbage characters | Baud rate mismatch | Set Serial Monitor baud rate to **115200** (`Tools → Serial Monitor`) |
| `WiFi unavailable. Skipping send.` in Serial Monitor | Wrong SSID/password, or 5 GHz network (ESP32 only supports 2.4 GHz) | Double-check credentials; connect to a 2.4 GHz WiFi network |
| `HTTP Response: -1` or negative response code | `serverName` IP is wrong, or the backend isn't running/reachable on that network | Confirm the backend is running, re-run `ipconfig`/`ifconfig` (IP changes across networks/reboots), and make sure the ESP32 and PC are on the same network |
| Readings arrive but never show up on the dashboard | `sensorId` in the sketch doesn't match a registered node | Register the node first (`node seed.js`, or Admin → Field Nodes), or edit the `sensorId` in the sketch to match an existing one |
| NPK values always read `0` or `NaN` | RS485 wiring reversed (A/B swapped), or wrong slave ID/baud rate | Swap NPK sensor's A+/B- wires; confirm slave ID `1` and baud `9600` match the sensor's actual configuration |
