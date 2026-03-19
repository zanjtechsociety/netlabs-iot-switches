// Helper to get IP from local storage or fallback to default
const getSavedIp = () => {
    return localStorage.getItem('esp32_ip') || "http://192.168.1.100/api";
};

const CONFIG = {
    // Set to false to use real hardware via Fetch API
    useSimulation: true,
    
    // IP address of the ESP32/ESP8266 (Now dynamically loaded)
    get deviceIp() {
        return getSavedIp();
    },

    set deviceIp(newIp) {
        localStorage.setItem('esp32_ip', newIp);
    }
};

export default CONFIG;