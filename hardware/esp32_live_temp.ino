#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// DHT11 Sensor Configuration
#define DHTPIN 4          // Connected to P4
#define DHTTYPE DHT11     // DHT11 sensor

DHT dht(DHTPIN, DHTTYPE);

// WiFi Credentials - REPLACE WITH YOUR NETWORK
const char* ssid = "Vivo";
const char* password = "39SSN993";

// Backend API Configuration - REPLACE WITH YOUR COMPUTER'S IP
const char* serverUrl = "http://10.177.162.108:3001/api/live-temperature";

// Location
String location = "Lab Test";

// Timing
unsigned long lastReadTime = 0;
const long readInterval = 3000;       // Read every 3 seconds

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== ESP32 Live Temperature Monitor ===");
  
  // Initialize DHT11 sensor
  dht.begin();
  Serial.println("DHT11 sensor initialized");
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n❌ WiFi Connection Failed!");
    Serial.print("Status Code: ");
    Serial.println(WiFi.status());
    Serial.println("Possible reasons:");
    Serial.println("  1. Wrong password");
    Serial.println("  2. 5GHz network (ESP32 needs 2.4GHz)");
    Serial.println("  3. Too far from router");
    Serial.println("  4. Network hidden or MAC filtering");
    Serial.println("\nWill continue reading sensor without sending to backend");
  }
  
  Serial.println("====================================\n");
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read sensor every interval
  if (currentTime - lastReadTime >= readInterval) {
    lastReadTime = currentTime;
    
    // Read temperature
    float temperature = dht.readTemperature();
    
    // Check if reading failed
    if (isnan(temperature)) {
      Serial.println("❌ Failed to read from DHT11 sensor!");
      return;
    }
    
    // Display on Serial Monitor
    Serial.println("─────────────────────────────────");
    Serial.print("🌡️  Temperature: ");
    Serial.print(temperature);
    Serial.println(" °C");
    Serial.print("📍 Location: ");
    Serial.println(location);
    
    // Check safe range (28°C to 33°C)
    if (temperature < 28 || temperature > 33) {
      Serial.println("⚠️  ALERT: Temperature out of safe range (28-33°C)!");
      if (temperature < 28) {
        Serial.println("   🥶 TOO COLD - Below 28°C");
      } else {
        Serial.println("   🔥 TOO HOT - Above 33°C");
      }
    } else {
      Serial.println("✅ Temperature OK (within 28-33°C range)");
    }
    
    // Send to backend if WiFi connected
    if (WiFi.status() == WL_CONNECTED) {
      sendToBackend(temperature);
    } else {
      Serial.println("❌ WiFi not connected - data not sent");
    }
  }
}

void sendToBackend(float temperature) {
  HTTPClient http;
  
  Serial.print("📡 Sending to website... ");
  
  // Prepare JSON payload
  String jsonData = "{";
  jsonData += "\"temperature\":" + String(temperature) + ",";
  jsonData += "\"location\":\"" + location + "\",";
  jsonData += "\"humidity\":0,";
  jsonData += "\"pressure\":101";
  jsonData += "}";
  
  // Send POST request
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonData);
  
  if (httpResponseCode == 200) {
    Serial.println("✅ Success!");
  } else {
    Serial.print("❌ Error! Code: ");
    Serial.println(httpResponseCode);
    Serial.println("   Check: Backend running? Correct IP?");
  }
  
  http.end();
  Serial.println("─────────────────────────────────\n");
}
