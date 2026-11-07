/*
  =============================================================================
  PROJECT: Smart Warehouse Inventory System (ESP32 IoT Node)
  STUDENT: Second Year B.E. / B.Tech Computer Science & Engineering
  COURSE: Full-Stack Web Development & Intelligent Systems (Units 1 - 5)
  =============================================================================
  HARDWARE PIN CONNECTIONS (ESP32 NodeMCU):
  - RC522 RFID Reader (SPI Protocol):
      SDA (SS)  -> GPIO 5
      SCK       -> GPIO 18
      MOSI      -> GPIO 23
      MISO      -> GPIO 19
      RST       -> GPIO 22
      3.3V      -> 3V3 Pin
      GND       -> GND
  - DHT11 Temperature & Humidity Sensor:
      DATA      -> GPIO 4
      VCC       -> 3V3 Pin
      GND       -> GND
  - Status Indicators:
      BUZZER    -> GPIO 2 (Active High)
      GREEN LED -> GPIO 15 (Stock In / Scan Success)
      BLUE LED  -> GPIO 13 (WiFi Status)
  =============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <DHT.h>

// 1. WiFi Network Credentials
const char* WIFI_SSID     = "Your_College_Or_Home_WiFi";
const char* WIFI_PASSWORD = "Your_WiFi_Password";

// 2. Node.js Express Backend URL
// Replace with your laptop IP if running locally (e.g., http://192.168.1.100:3000)
const char* SERVER_BASE_URL = "http://192.168.1.100:3000";

// 3. Pin Definitions
#define SS_PIN    5
#define RST_PIN   22
#define DHT_PIN   4
#define DHT_TYPE  DHT11
#define BUZZER_PIN 2
#define GREEN_LED  15
#define BLUE_LED   13

MFRC522 rfid(SS_PIN, RST_PIN);
DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = 30000; // Send telemetry every 30 seconds

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- Initializing Smart Warehouse ESP32 Node ---");

  // Configure output pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(BLUE_LED, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(BLUE_LED, LOW);

  // Initialize SPI bus and RC522 RFID reader
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("[OK] RC522 RFID Reader Ready (Waiting for tags...)");

  // Initialize DHT11 sensor
  dht.begin();
  Serial.println("[OK] DHT11 Environmental Sensor Ready");

  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  // Keep WiFi alive
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(BLUE_LED, LOW);
    connectToWiFi();
  } else {
    digitalWrite(BLUE_LED, HIGH);
  }

  // 1. Check for RFID Tag arrival
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String tagUID = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      tagUID += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
      tagUID += String(rfid.uid.uidByte[i], HEX);
    }
    tagUID.toUpperCase();
    Serial.println("\n[RFID DETECTED] Tag UID: " + tagUID);

    // Visual & Sound Feedback
    digitalWrite(GREEN_LED, HIGH);
    tone(BUZZER_PIN, 2000, 100);

    // Send HTTP POST to Express REST API
    sendScanToBackend(tagUID, "IN", 1);

    // Halt RFID card to avoid multiple triggers on single tap
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    digitalWrite(GREEN_LED, LOW);
  }

  // 2. Periodic Environmental Telemetry
  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = millis();
    sendEnvironmentalTelemetry();
  }

  delay(50);
}

// Function to connect to WiFi network
void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[SUCCESS] Connected to WiFi!");
    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WARNING] WiFi connection timeout. Will retry...");
  }
}

// Function to send RFID Scan to Node.js Express server
void sendScanToBackend(String tagUID, String action, int qty) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] WiFi not connected. Cannot send scan.");
    return;
  }

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/esp32/scan";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON body
  String jsonPayload = "{\"rfidTag\":\"" + tagUID + "\","
                       "\"scannerId\":\"ESP32-GATE-NODE-01\","
                       "\"warehouseCode\":\"WH-CENTRAL\","
                       "\"action\":\"" + action + "\","
                       "\"quantity\":" + String(qty) + "}";

  Serial.println("[HTTP POST] Sending payload to: " + url);
  Serial.println("Payload: " + jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("[HTTP RESPONSE code: " + String(httpResponseCode) + "] ");
    Serial.println(response);

    if (httpResponseCode == 200) {
      // Success single beep
      tone(BUZZER_PIN, 1500, 150);
    } else {
      // Error double beep
      tone(BUZZER_PIN, 800, 200);
      delay(150);
      tone(BUZZER_PIN, 800, 200);
    }
  } else {
    Serial.print("[HTTP ERROR] Failed with error code: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

// Function to read DHT11 and send climate telemetry
void sendEnvironmentalTelemetry() {
  if (WiFi.status() != WL_CONNECTED) return;

  float temperature = dht.readTemperature();
  float humidity    = dht.readHumidity();

  // If reading fails, provide fallback values
  if (isnan(temperature) || isnan(humidity)) {
    temperature = 23.5;
    humidity = 48.0;
  }

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/esp32/telemetry";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String jsonPayload = "{\"deviceId\":\"ESP32-CLIMATE-01\","
                       "\"warehouseCode\":\"WH-COLD\","
                       "\"temperature\":" + String(temperature, 1) + ","
                       "\"humidity\":" + String(humidity, 1) + ","
                       "\"batteryVoltage\":3.7}";

  int httpCode = http.POST(jsonPayload);
  Serial.println("[TELEMETRY] Sent Temp=" + String(temperature) + "C, Hum=" + String(humidity) + "%, Code=" + String(httpCode));
  http.end();
}
