# MQTT Architecture for Remote AC Dimmer Control

If you want the ability to control the AC Dimmer from **anywhere in the world** (over 4G/5G, outside your local WiFi network), you cannot rely on the HTTP `fetch` API directly to the ESP32. Instead, you must introduce an IoT communication protocol called **MQTT (Message Queuing Telemetry Transport)**.

## Why MQTT over HTTP?

*   **HTTP (Fetch):** The Client (Mobile App) must know the exact IP address of the Server (ESP32). This only works if both are on the same WiFi router. If you leave the house, the Mobile App cannot reach `192.168.1.100`.
*   **MQTT:** Both the Client (Mobile App) and the Device (ESP32) connect to a central server in the cloud called a **Broker**. They don't need to know each other's IP addresses. They just need internet access.

## The Architecture

```text
[ Mobile App ]  ------(Publishes to)-----> [ Cloud MQTT Broker ]
                                                   |
[ ESP32 Dimmer ] <-----(Subscribes to)-------------+
```

1.  **The Broker:** A server sitting on the internet (e.g., HiveMQ, Mosquitto, or AWS IoT). It acts as the post office.
2.  **Topics:** Data is organized into "topics" (like chat rooms).
    *   Command Topic: `home/dimmer/1/set` (App tells ESP32 what to do)
    *   State Topic: `home/dimmer/1/state` (ESP32 tells App what its current status is)
3.  **Publish / Subscribe:**
    *   The ESP32 connects to WiFi, connects to the Broker, and **subscribes** to `home/dimmer/1/set`.
    *   You move the slider on your phone. The phone **publishes** `{"brightness": 75}` to `home/dimmer/1/set`.
    *   The Broker instantly forwards that message to the ESP32.

## What Changes in the Project?

If you migrate to MQTT, the code structure changes significantly:

### 1. ESP32 Firmware Changes (C++)
You drop the `WebServer` library and use `PubSubClient` (or `AsyncMqttClient`).

```cpp
#include <PubSubClient.h>

// When a message arrives from the cloud...
void callback(char* topic, byte* payload, unsigned int length) {
    if (strcmp(topic, "home/dimmer/1/set") == 0) {
        // Parse JSON payload
        // Set Triac brightness
        
        // Immediately publish back the new state so the app knows it worked
        client.publish("home/dimmer/1/state", "{\"brightness\": 75}");
    }
}

void loop() {
    client.loop(); // Keeps connection to cloud alive
}
```

### 2. Frontend / Mobile App Changes
You drop the HTTP `fetch()` API. Instead, you use an MQTT library. 
*   If using the **Web UI**, you use `MQTT.js` (which connects to the broker via WebSockets).
*   If using **React Native / Flutter**, you use their respective native MQTT packages.

```javascript
// Web UI Example using MQTT.js
const client = mqtt.connect('wss://broker.hivemq.com:8000/mqtt');

client.on('connect', () => {
    // Listen for updates from the hardware
    client.subscribe('home/dimmer/1/state');
});

// When someone moves the slider on the UI
function sendBrightnessUpdate(level) {
    client.publish('home/dimmer/1/set', JSON.stringify({ brightness: level }));
}
```

## Pros and Cons of MQTT

### Advantages
1.  **Global Access:** Control the light from anywhere.
2.  **Push Notifications:** No more polling (like we did with `setInterval`). MQTT pushes the data instantly. If someone uses the wall switch, the ESP32 publishes to the `state` topic, and the mobile app updates in < 50ms.
3.  **Lightweight:** MQTT headers are tiny (2 bytes) compared to HTTP (hundreds of bytes), saving battery and memory on the ESP32.

### Challenges for a Capstone
1.  **Infrastructure:** You have to set up or pay for a cloud MQTT broker (though free tiers exist like HiveMQ Public Broker or Shiftr.io).
2.  **Security:** Because it's on the open internet, you *must* implement TLS/SSL certificates and username/password authentication on the ESP32, which is notoriously difficult for beginners in C++.
3.  **No Local Fallback (Usually):** If the internet goes down, but your home WiFi is still up, an HTTP local fetch app will still work. An MQTT cloud app will not (unless you run a local broker on a Raspberry Pi).