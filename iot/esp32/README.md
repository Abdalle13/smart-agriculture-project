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
| DE         | GPIO 5    |
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

Example payload sent every 30 seconds:
```json
{
  "sensorId":    "s001",
  "temperature": 29.3,
  "humidity":    58.0,
  "moisture":    42.0,
  "nitrogen":    87,
  "phosphorus":  34,
  "potassium":   142
}
```

A successful response returns HTTP `201 Created`.
