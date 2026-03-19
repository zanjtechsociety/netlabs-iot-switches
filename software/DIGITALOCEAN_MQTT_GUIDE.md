# Setting up an MQTT Broker on DigitalOcean

Yes, DigitalOcean is an excellent choice for hosting your own cloud MQTT broker. Instead of paying for a managed IoT service (like AWS IoT or HiveMQ Cloud), you can rent a basic Linux server (Droplet) and run the broker software yourself.

## 1. The Broker Software: Eclipse Mosquitto
The industry standard, open-source MQTT broker is **Mosquitto**. It is extremely lightweight and can easily handle thousands of concurrent IoT devices on the cheapest server available.

## 2. Infrastructure Setup (DigitalOcean)

### Step 1: Create a Droplet
1. Log into DigitalOcean and create a new **Droplet**.
2. **OS:** Choose **Ubuntu 22.04** or newer.
3. **Plan:** The cheapest **$4 or $6/month "Basic" plan** (1GB RAM, 1 CPU) is more than enough for a Capstone project.
4. **Authentication:** Add your SSH key for secure access.

### Step 2: Install Mosquitto
SSH into your new droplet:
```bash
ssh root@YOUR_DROPLET_IP
```

Install the Mosquitto broker and the command-line clients:
```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
```
Mosquitto will automatically start running in the background as a system service.

## 3. Configuration & Security

By default, modern versions of Mosquitto (v2.0+) only allow connections from `localhost` and do not allow anonymous users. You must configure it to accept external connections from your ESP32 and Mobile App.

### Step 1: Create a Password File
You need a username and password so random people on the internet can't control your lights.
```bash
# Create a user called "esp32_user" (it will prompt you to type a password)
sudo mosquitto_passwd -c /etc/mosquitto/passwd esp32_user

# (Optional) Create a second user for your Mobile App
sudo mosquitto_passwd /etc/mosquitto/passwd mobile_app
```

### Step 2: Edit the Configuration File
Open the main configuration file:
```bash
sudo nano /etc/mosquitto/conf.d/default.conf
```

Paste the following to allow external traffic and enforce passwords:
```text
# Allow standard MQTT connections on port 1883
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd

# Allow WebSockets on port 9001 (CRUCIAL for Web/PWA frontends)
listener 9001
protocol websockets
```

### Step 3: Restart the Broker
```bash
sudo systemctl restart mosquitto
```

## 4. Why WebSockets (Port 9001) are Critical
Notice we opened two ports:
1. **Port 1883 (Raw MQTT):** This is what your C++ ESP32 code uses. It is a lightweight, raw TCP socket connection.
2. **Port 9001 (WebSockets):** Browsers (and by extension, Web Apps and PWAs) **cannot** make raw TCP connections for security reasons. They can only make HTTP or WebSocket connections. Mosquitto can wrap MQTT messages inside WebSockets so your Javascript frontend can talk to the broker.

## 5. Firewall Configuration (UFW)
Ensure Ubuntu's firewall allows traffic on these ports:
```bash
sudo ufw allow 1883/tcp
sudo ufw allow 9001/tcp
```

## 6. How Your Project Connects Now

1. **The ESP32 (C++):** 
   Connects to `YOUR_DROPLET_IP` on port `1883` using the `PubSubClient` library.
2. **The Frontend (app.js):** 
   Uses the `MQTT.js` library to connect to `ws://YOUR_DROPLET_IP:9001`.

*Note: For a true production system, you would want to put Mosquitto behind an Nginx reverse proxy to enable SSL/TLS (turning `ws://` into `wss://` and `mqtt://` into `mqtts://`), but for a Capstone demo, raw TCP/WebSockets over DigitalOcean is usually perfectly acceptable.*