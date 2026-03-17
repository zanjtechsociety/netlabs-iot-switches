# Using the Fetch API for IoT AC Dimmer Control

This document outlines how the JavaScript `fetch` API can be used to communicate between a web frontend and the IoT microcontroller (e.g., ESP32 or ESP8266) to control an AC bulb dimmer.

## Architecture Overview

In an IoT dimmer project, the architecture typically follows a Client-Server model:
1. **Client (Web/Mobile App):** Uses the `fetch` API to send HTTP requests containing the desired brightness level.
2. **Server (Microcontroller):** Runs a lightweight web server. It receives the HTTP request, extracts the brightness value, and adjusts the hardware (e.g., adjusting the firing angle of a TRIAC using a zero-crossing detection circuit).

## 1. Frontend Implementation (JavaScript)

The `fetch` API is a modern, promise-based mechanism for making web requests. To control the dimmer, we send a `POST` request with the brightness value (usually a percentage from 0 to 100) in JSON format.

### Example: Sending a Brightness Value
```javascript
// Function to update the dimmer brightness
async function setDimmerLevel(brightness) {
    // Ensure brightness is between 0 and 100
    const clampedBrightness = Math.max(0, Math.min(100, brightness));
    
    // IP Address of the ESP32/ESP8266 on the local network
    const deviceIp = "http://192.168.1.100/api/dimmer"; 

    try {
        const response = await fetch(deviceIp, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ level: clampedBrightness })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Dimmer updated successfully:", result);

    } catch (error) {
        console.error("Failed to update dimmer:", error);
    }
}

// Example usage: Set brightness to 75%
setDimmerLevel(75);
```

## 2. Microcontroller Implementation (C++ / ESP32)

To make the `fetch` request work, the microcontroller must listen for the incoming HTTP request. Below is a conceptual example using the `ESPAsyncWebServer` or standard `WebServer` library.

### Example: Handling the Request (ESP32)
```cpp
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h> // Useful for parsing the incoming JSON

WebServer server(80);

void setup() {
    Serial.begin(115200);
    // ... WiFi connection setup code here ...

    // Define the API endpoint that matches the fetch request
    server.on("/api/dimmer", HTTP_POST, []() {
        if (server.hasArg("plain")) {
            String body = server.arg("plain");
            
            StaticJsonDocument<200> doc;
            DeserializationError error = deserializeJson(doc, body);
            
            if (error) {
                server.send(400, "application/json", "{\"status\":\"error\", \"message\":\"Invalid JSON\"}");
                return;
            }
            
            // Extract the brightness level (0-100)
            int brightness = doc["level"];
            
            // TODO: Apply the brightness to your Triac / Zero-Cross logic here
            // e.g., map(brightness, 0, 100, MAX_DELAY, MIN_DELAY);
            
            Serial.printf("Setting dimmer level to: %d%%\n", brightness);
            
            // Respond back to the fetch API
            server.send(200, "application/json", "{\"status\":\"success\"}");
        } else {
            server.send(400, "application/json", "{\"status\":\"error\", \"message\":\"No body payload\"}");
        }
    });

    // Handle CORS (Crucial if your frontend is hosted elsewhere)
    server.onNotFound([]() {
        if (server.method() == HTTP_OPTIONS) {
            server.sendHeader("Access-Control-Allow-Origin", "*");
            server.sendHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
            server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
            server.send(204);
        } else {
            server.send(404, "text/plain", "Not found");
        }
    });

    server.begin();
}

void loop() {
    server.handleClient();
}
```

## Key Considerations for the AC Dimmer
- **CORS (Cross-Origin Resource Sharing):** Browsers block `fetch` requests to different IP addresses by default. The ESP32 server must include CORS headers (like `Access-Control-Allow-Origin: *`) in its responses so the browser allows the request.
- **Latency & Debouncing:** Sliding a UI range slider can trigger hundreds of `fetch` requests per second. Implement a "debounce" or "throttle" function in your JavaScript so it only sends a request every ~100-200ms to avoid crashing the microcontroller.
- **Safety:** AC mains voltage is dangerous. Ensure the microcontroller is optically isolated (using optocouplers like MOC3021 and PC817 for zero-crossing) from the AC circuit.
