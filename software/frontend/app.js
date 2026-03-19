import { dimmerApi } from './api/index.js';
import CONFIG from './api/config.js';

// DOM Elements
const bulbElement = document.getElementById('bulb');
const brightnessSlider = document.getElementById('brightness-slider');
const brightnessValueDisplay = document.getElementById('brightness-value');
const powerButton = document.getElementById('power-btn');
const statusIndicator = document.getElementById('status-indicator');

// App State
let isPowerOn = true;
let currentBrightness = 50;

// Utility: Debounce function to prevent spamming the API
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

// Update the UI to match state
function updateUI() {
    brightnessValueDisplay.textContent = `${currentBrightness}%`;
    brightnessSlider.value = currentBrightness;
    
    if (isPowerOn) {
        powerButton.textContent = 'Turn OFF';
        powerButton.classList.replace('bg-green-500', 'bg-red-500');
        powerButton.classList.replace('hover:bg-green-600', 'hover:bg-red-600');
        
        // Calculate bulb glow based on brightness
        const opacity = currentBrightness / 100;
        bulbElement.style.backgroundColor = `rgba(252, 211, 77, ${opacity})`; // Amber-300
        bulbElement.style.boxShadow = `0 0 ${currentBrightness * 1.5}px rgba(252, 211, 77, ${opacity})`;
    } else {
        powerButton.textContent = 'Turn ON';
        powerButton.classList.replace('bg-red-500', 'bg-green-500');
        powerButton.classList.replace('hover:bg-red-600', 'hover:bg-green-600');
        
        // Turn off bulb
        bulbElement.style.backgroundColor = '#4B5563'; // Gray-600
        bulbElement.style.boxShadow = 'none';
    }

    statusIndicator.textContent = CONFIG.useSimulation ? 'Mode: Simulated Demo' : 'Mode: Live (ESP32)';
    statusIndicator.className = CONFIG.useSimulation ? 'text-blue-500 font-semibold' : 'text-green-500 font-semibold';
}

// Handlers
const handleBrightnessChange = async (event) => {
    const val = parseInt(event.target.value, 10);
    currentBrightness = val;
    updateUI(); // Update UI instantly for smooth feel
};

// Debounced API call to prevent server overload
const sendBrightnessUpdate = debounce(async (val) => {
    try {
        await dimmerApi.setBrightness(val);
    } catch (error) {
        console.error("Failed to set brightness", error);
    }
}, 150);

const handlePowerToggle = async () => {
    isPowerOn = !isPowerOn;
    updateUI(); // Immediate UI feedback
    
    try {
        await dimmerApi.togglePower(isPowerOn);
    } catch (error) {
        console.error("Failed to toggle power", error);
        // Revert UI on failure
        isPowerOn = !isPowerOn;
        updateUI();
    }
};

// Initialization
async function init() {
    // Attach listeners
    brightnessSlider.addEventListener('input', (e) => {
        handleBrightnessChange(e);
        sendBrightnessUpdate(parseInt(e.target.value, 10));
    });
    
    powerButton.addEventListener('click', handlePowerToggle);

    // Fetch initial status from the device/simulation
    try {
        const response = await dimmerApi.getStatus();
        if (response.status === 'success') {
            isPowerOn = response.data.power;
            currentBrightness = response.data.brightness;
            updateUI();
        }
    } catch (error) {
        console.error("Failed to fetch initial status", error);
        statusIndicator.textContent = 'Error: Cannot connect to device';
        statusIndicator.className = 'text-red-500 font-bold';
    }
}

// Boot up the app
init();