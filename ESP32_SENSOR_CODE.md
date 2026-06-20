# ESP32 IoT Sensor Integration Guide

## 🌐 WiFi Connection Code (Primary Mode)

Replace your Arduino code with this ESP32 WiFi-enabled version:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Supabase Edge Function URL
const char* serverUrl = "https://colsrypdsagbweilmliv.supabase.co/functions/v1/iot-sensor-data";
const char* apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvbHNyeXBkc2FnYndlaWxtbGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NTEyMzMsImV4cCI6MjA3NjQyNzIzM30.10rwqWdalJDhzo7ou_CV4Wma9fS8MA7HL0qjmg8rW08";

// Sensor configuration
String sensorId = "ESP32_SENSOR_001"; // Change this for each device
int phPin = 34;          // GPIO 34 (ADC1_CH6)
int turbidityPin = 35;   // GPIO 35 (ADC1_CH7)
int tempPin = 32;        // GPIO 32 (ADC1_CH4)

// Battery monitoring (optional)
int batteryPin = 33;     // GPIO 33 for battery voltage divider
int batteryLevel = 100;

// Calibration constants
float voltage4 = 1.75;
float voltage7 = 2.50;
float voltage10 = 3.25;
float slope = (10.0 - 4.0) / (voltage10 - voltage4);
float intercept = 7.0 - slope * voltage7;

void setup() {
  Serial.begin(115200);
  Serial.println("AquaGuard IoT Sensor Starting...");
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Connection Failed!");
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    WiFi.reconnect();
    delay(5000);
    return;
  }
  
  // Read sensors
  float ph = readPH();
  float turbidity = readTurbidity();
  float tds = turbidity * 0.65;
  float temperature = readTemperature();
  batteryLevel = readBattery();
  
  // Print to Serial
  Serial.println("\n========== Sensor Readings ==========");
  Serial.printf("Sensor ID: %s\n", sensorId.c_str());
  Serial.printf("pH: %.2f\n", ph);
  Serial.printf("Turbidity: %.2f NTU\n", turbidity);
  Serial.printf("TDS: %.2f ppm\n", tds);
  Serial.printf("Temperature: %.2f °C\n", temperature);
  Serial.printf("Battery: %d%%\n", batteryLevel);
  Serial.println("====================================\n");
  
  // Send data to server
  sendDataToServer(ph, tds, turbidity, temperature);
  
  // Wait 60 seconds before next reading
  delay(60000);
}

float readPH() {
  int phValue = analogRead(phPin);
  float voltagePh = phValue * (3.3 / 4095.0); // ESP32 uses 3.3V and 12-bit ADC
  return slope * voltagePh + intercept;
}

float readTurbidity() {
  int turbValue = analogRead(turbidityPin);
  float voltageTurb = turbValue * (3.3 / 4095.0);
  return 3000 - (voltageTurb * 1000);
}

float readTemperature() {
  int tempValue = analogRead(tempPin);
  float voltageTemp = tempValue * (3.3 / 4095.0);
  return voltageTemp * 100; // LM35: 10mV per °C
}

int readBattery() {
  int battValue = analogRead(batteryPin);
  float battVoltage = battValue * (3.3 / 4095.0) * 2; // Voltage divider adjustment
  return map(constrain(battVoltage * 100, 320, 420), 320, 420, 0, 100);
}

void sendDataToServer(float ph, float tds, float turbidity, float temperature) {
  HTTPClient http;
  
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", apiKey);
  http.addHeader("Authorization", String("Bearer ") + apiKey);
  
  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["sensor_id"] = sensorId;
  doc["ph"] = ph;
  doc["tds"] = tds;
  doc["turbidity"] = turbidity;
  doc["temperature"] = temperature;
  doc["battery_level"] = batteryLevel;
  doc["communication_mode"] = "wifi";
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.println("Sending data to server...");
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    Serial.printf("✓ Server Response: %d\n", httpResponseCode);
    String response = http.getString();
    Serial.println(response);
  } else {
    Serial.printf("✗ Error: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  
  http.end();
}
```

## 📱 GSM/SMS Fallback Mode (For Remote Areas)

For areas without WiFi, use SIM800L module:

```cpp
#include <SoftwareSerial.h>

SoftwareSerial sim800(16, 17); // RX, TX pins

const char* gatewayNumber = "+1234567890"; // Your Twilio number

void sendViaSMS(float ph, float tds, float turbidity, float temperature) {
  String message = "SENSOR:" + sensorId + 
                   "|PH:" + String(ph, 2) + 
                   "|TDS:" + String(tds, 2) + 
                   "|TURB:" + String(turbidity, 2) + 
                   "|TEMP:" + String(temperature, 2) + 
                   "|BAT:" + String(batteryLevel);
  
  sim800.println("AT+CMGF=1"); // Text mode
  delay(100);
  sim800.print("AT+CMGS=\"");
  sim800.print(gatewayNumber);
  sim800.println("\"");
  delay(100);
  sim800.print(message);
  delay(100);
  sim800.write(26); // Ctrl+Z to send
  
  Serial.println("SMS sent: " + message);
}
```

## 🔧 Required Hardware

- **ESP32 DevKit** (WiFi-enabled microcontroller)
- **pH Sensor Module** (e.g., Gravity Analog pH Sensor)
- **Turbidity Sensor** (e.g., SEN0189)
- **LM35 Temperature Sensor**
- **SIM800L GSM Module** (optional, for SMS backup)
- **18650 Li-ion Battery** (for power backup)
- **TP4056 Charging Module**

## 📦 Required Arduino Libraries

Install these via Arduino Library Manager:

```bash
1. ArduinoJson (by Benoit Blanchon)
2. WiFi (ESP32 built-in)
3. HTTPClient (ESP32 built-in)
```

## 🚀 Quick Setup Steps

### Step 1: Install ESP32 Board Support
1. Open Arduino IDE
2. Go to **File → Preferences**
3. Add to "Additional Board Manager URLs":
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
4. Go to **Tools → Board → Board Manager**
5. Search "ESP32" and install

### Step 2: Configure the Code
1. Replace `YOUR_WIFI_SSID` with your WiFi name
2. Replace `YOUR_WIFI_PASSWORD` with your WiFi password
3. Change `sensorId` to unique ID (e.g., "VILLAGE_NORTH_01")
4. Calibrate pH sensor voltages

### Step 3: Upload to ESP32
1. Connect ESP32 via USB
2. Select **Tools → Board → ESP32 Dev Module**
3. Select correct COM port
4. Click **Upload**

### Step 4: Monitor Output
1. Open **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. Watch sensor readings and server responses

## 🔐 Security Note

The API key in the code is the **public anon key** - it's safe to use in IoT devices as it only allows authenticated operations.

## 📊 Data Flow

```
ESP32 Sensor → WiFi → Edge Function (iot-sensor-data)
                ↓
         Database (water_quality_readings)
                ↓
         Auto Alert System (if thresholds exceeded)
                ↓
         Dashboard Updates (Real-time)
```

## 🌐 Viewing Your Data

After setup, your sensor data will appear in:
- **IoT Monitoring Page** (`/iot-monitoring`)
- **Official Dashboard** (real-time charts)
- **Community Dashboard** (risk alerts)

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| WiFi won't connect | Check SSID/password, ensure 2.4GHz network |
| HTTP Error -1 | Check server URL and API key |
| Sensor reads 0 | Check wiring and pin numbers |
| Battery drains fast | Increase delay between readings |

## 📝 SMS Format (for GSM mode)

The SMS gateway expects this format:
```
SENSOR:ID123|PH:7.2|TDS:450|TURB:3.5|TEMP:25.5|BAT:85
```

This is automatically parsed by the `sms-sensor-gateway` edge function.
