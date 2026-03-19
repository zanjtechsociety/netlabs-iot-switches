# Frontend Simulation & API Architecture

This document explains the architecture of the web-based frontend created for the AC Dimmer project, focusing on how the simulated environment works and how it transitions to communicating with real hardware using the `fetch` API.

## Project Structure

The `software/frontend/` directory contains the following components:

```text
frontend/
├── index.html        # The main UI (Tailwind CSS styled)
├── app.js            # Main application logic and DOM manipulation
└── api/
    ├── config.js     # Global configuration (Simulation toggle & Device IP)
    ├── index.js      # The API Router (Directs calls to hardware or simulation)
    └── simulation.js # The Mock Backend (Simulates hardware delay and state)
```

## 1. The Core Concept: Abstraction

When building a frontend for hardware that is not yet ready, the best practice is to **abstract the API layer**. 

Instead of writing `fetch("http://192.168.1.100")` directly inside your button click handlers in `app.js`, we create an intermediate layer: `dimmerApi` in `api/index.js`. 

The UI (`app.js`) only knows how to call `dimmerApi.setBrightness(75)`. It doesn't know (or care) if that data goes to a real ESP32 or a fake simulated backend. 

## 2. Configuration (`config.js`)

This file acts as the master switch.
```javascript
const CONFIG = {
    useSimulation: true, // SET TO FALSE TO USE REAL HARDWARE
    deviceIp: "http://192.168.1.100/api"
};
```
When `useSimulation` is `true`, all requests are routed to the fake backend. When you are ready to test the real ESP32, you change this to `false`.

## 3. The Mock Backend (`simulation.js`)

This file pretends to be the ESP32. Network requests take time, so we simulate this delay using JavaScript `Promises` and `setTimeout`.

```javascript
// Simulates a 150ms network round-trip delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
```
It maintains a fake internal state (`mockDeviceState`) so if you turn the power off, and then fetch the status later, it correctly remembers that the power is off.

## 4. The API Router (`index.js`)

This file makes the decision based on `config.js`. 

If `useSimulation` is false, it executes the real `fetch` request.

### Understanding the `fetch` call

```javascript
const response = await fetch(`${CONFIG.deviceIp}/dimmer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level }) // e.g., { "level": 75 }
});
```

*   **`await`**: Because `fetch` is asynchronous (it takes time over a network), we must `await` the result. This pauses the function execution until the ESP32 responds.
*   **`method: 'POST'`**: We are *sending* data to the server to change a state, which dictates a POST request.
*   **`headers`**: We tell the ESP32 that the body of the request is formatted as JSON.
*   **`body`**: We take our JavaScript object `{ level: 75 }` and convert it into a string format (`JSON.stringify`) so it can be sent over HTTP.

## 5. UI Logic & Debouncing (`app.js`)

The UI is built with standard HTML/JS. However, handling a slider for hardware control introduces a critical problem: **Network Flooding**.

### The Debounce Problem
If you drag an HTML slider from 0 to 100, the browser fires an `input` event for almost every number in between. If you sent a `fetch` request for every event, you would send ~50-100 HTTP requests per second to the ESP32. 
Microcontrollers have very limited RAM and single-threaded web servers. Flooding them with requests will cause the ESP32 to crash or drop the WiFi connection.

### The Debounce Solution
We wrap our API call in a `debounce` function.

```javascript
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
```

**How it works:** 
Every time the slider moves, the debounce function starts a timer (e.g., 150ms). If the slider moves *again* before 150ms finishes, the timer resets. The `fetch` API is only called when the user stops moving the slider for a full 150ms. 

This ensures the UI remains perfectly smooth, but the ESP32 only receives the final, intended brightness value.