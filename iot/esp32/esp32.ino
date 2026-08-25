#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ModbusMaster.h>

// WiFi credentials
const char* ssid     = "Ak7";
const char* password = "11115555";

// Server URL — update to your machine's local IPv4 address
String serverName = "http://172.19.188.160:5000/api/sensors/readings";

// Production (Railway backend) — comment the local line above and uncomment this one to go live
// String serverName = "https://smart-agriculture-project-production-ab20.up.railway.app//api/sensors/readings";

// DHT11 — temperature + air humidity (pin 14)
#define DHTPIN 14
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Soil Moisture — analog capacitive sensor (pin 34)
#define SOIL_PIN 34

// RS485 MAX485 — NPK sensor control pins
#define RE_PIN 4
#define DE_PIN 19

HardwareSerial RS485Serial(2); // UART2: RX=16, TX=17
ModbusMaster node;

void preTransmission() {
  digitalWrite(DE_PIN, HIGH);
  digitalWrite(RE_PIN, HIGH);
}

void postTransmission() {
  digitalWrite(DE_PIN, LOW);
  digitalWrite(RE_PIN, LOW);
}

// Reconnect WiFi if disconnected
void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("Reconnecting WiFi");
  WiFi.disconnect();
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Reconnected");
  } else {
    Serial.println("\nWiFi Reconnect Failed");
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();

  // RS485 pins setup
  pinMode(RE_PIN, OUTPUT);
  pinMode(DE_PIN, OUTPUT);
  digitalWrite(RE_PIN, LOW);
  digitalWrite(DE_PIN, LOW);

  // RS485 serial (baud 9600, RX=16, TX=17)
  RS485Serial.begin(9600, SERIAL_8N1, 16, 17);

  // Modbus (Slave ID 1)
  node.begin(1, RS485Serial);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  // Connect WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi Connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // DHT11 — temperature + humidity
  float humidity    = dht.readHumidity();
  float temperature = dht.readTemperature();

  // Soil moisture — analog to percentage (0–100%)
  int soilRaw = analogRead(SOIL_PIN);
  int moisture = map(soilRaw, 4095, 1200, 0, 100);
  moisture = constrain(moisture, 0, 100);

  // NPK via Modbus RS485
  int N = 0, P = 0, K = 0;
  uint8_t result = node.readHoldingRegisters(0x001E, 3);
  if (result == node.ku8MBSuccess) {
    N = node.getResponseBuffer(0); // Nitrogen mg/kg
    P = node.getResponseBuffer(1); // Phosphorus mg/kg
    K = node.getResponseBuffer(2); // Potassium mg/kg
  } else {
    Serial.print("Modbus Error: ");
    Serial.println(result, HEX);
  }

  // Print to Serial Monitor
  Serial.println("============");
  Serial.print("Temp: ");       Serial.print(temperature); Serial.println(" C");
  Serial.print("Humidity: ");   Serial.print(humidity);    Serial.println(" %");
  Serial.print("Moisture: ");   Serial.print(moisture);    Serial.println(" %");
  Serial.print("Nitrogen: ");   Serial.print(N);           Serial.println(" mg/kg");
  Serial.print("Phosphorus: "); Serial.print(P);           Serial.println(" mg/kg");
  Serial.print("Potassium: ");  Serial.print(K);           Serial.println(" mg/kg");

  // Ensure WiFi is connected before sending
  ensureWiFi();

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    float sendTemp = isnan(temperature) ? 0.0 : temperature;
    float sendHum  = isnan(humidity)    ? 0.0 : humidity;

    String json = "{";
    json += "\"sensorId\":\"s001\",";
    json += "\"temperature\":" + String(sendTemp) + ",";
    json += "\"humidity\":"    + String(sendHum)  + ",";
    json += "\"moisture\":"    + String(moisture) + ",";
    json += "\"nitrogen\":"    + String(N)        + ",";
    json += "\"phosphorus\":"  + String(P)        + ",";
    json += "\"potassium\":"   + String(K);
    json += "}";

    int httpResponseCode = http.POST(json);
    Serial.print("HTTP Response: ");
    Serial.println(httpResponseCode);
    http.end();
  } else {
    Serial.println("WiFi unavailable. Skipping send.");
  }

  delay(5000); // 5 seconds for testing (change back to 30000 for production)
}
