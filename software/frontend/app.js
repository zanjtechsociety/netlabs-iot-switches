import { dimmerApi } from './api/index.js';
import CONFIG from './api/config.js';

// DOM Elements
const bulbElement = document.getElementById('bulb');
const brightnessSlider = document.getElementById('brightness-slider');
const brightnessValueDisplay = document.getElementById('brightness-value');
const powerButton = document.getElementById('power-btn');
const statusIndicator = document.getElementById('status-indicator');

// Settings DOM Elements
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings');
const simToggle = document.getElementById('sim-toggle');
const ipInput = document.getElementById('ip-input');
const toastContainer = document.getElementById('toast-container');

// App State
let isPowerOn = true;
let currentBrightness = 50;
let pollInterval;

// Load initial config from localStorage
const storedSimPref = localStorage.getItem('use_simulation');
if (storedSimPref !== null) {
    CONFIG.useSimulation = storedSimPref === 'true';
}

// Utility: Show Toast Notification
function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
    toast.className = `${bgColor} text-white px-4 py-2 rounded shadow-lg transform transition-all duration-300 opacity-0 translate-y-4`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('opacity-0', 'translate-y-4');
    }, 10);

    // Animate out and remove
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

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

    statusIndicator.textContent = CONFIG.useSimulation ? 'Mode: Simulated Demo' : `Mode: Live (${CONFIG.deviceIp})`;
    statusIndicator.className = CONFIG.useSimulation ? 'text-blue-500 font-semibold text-xs' : 'text-green-500 font-semibold text-xs';
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
        showToast("Failed to set brightness. Check connection.");
    }
}, 150);

const handlePowerToggle = async () => {
    isPowerOn = !isPowerOn;
    updateUI(); // Immediate UI feedback
    
    try {
        await dimmerApi.togglePower(isPowerOn);
    } catch (error) {
        console.error("Failed to toggle power", error);
        showToast("Failed to toggle power. Reverting.");
        // Revert UI on failure
        isPowerOn = !isPowerOn;
        updateUI();
    }
};

// Polling function to sync state with the hardware
const pollStatus = async () => {
    try {
        const response = await dimmerApi.getStatus();
        if (response.status === 'success') {
            // Only update if the values actually changed to prevent UI jitter
            if (isPowerOn !== response.data.power || currentBrightness !== response.data.brightness) {
                isPowerOn = response.data.power;
                currentBrightness = response.data.brightness;
                updateUI();
            }
        }
    } catch (error) {
        console.error("Polling failed", error);
        statusIndicator.textContent = 'Offline - Connection Lost';
        statusIndicator.className = 'text-red-500 font-bold text-xs';
    }
};

// Settings Handlers
settingsBtn.addEventListener('click', () => {
    simToggle.checked = CONFIG.useSimulation;
    ipInput.value = CONFIG.deviceIp;
    settingsModal.classList.remove('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

saveSettingsBtn.addEventListener('click', () => {
    const newSimPref = simToggle.checked;
    const newIp = ipInput.value.trim();

    localStorage.setItem('use_simulation', newSimPref);
    CONFIG.useSimulation = newSimPref;
    
    if (newIp) {
        CONFIG.deviceIp = newIp;
    }

    settingsModal.classList.add('hidden');
    showToast("Settings saved! Reloading...", "success");
    
    // Quick reload to re-initialize with new settings
    setTimeout(() => window.location.reload(), 1000);
});

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
            
            // Start polling every 3 seconds to keep UI in sync with hardware
            pollInterval = setInterval(pollStatus, 3000);
        }
    } catch (error) {
        console.error("Failed to fetch initial status", error);
        statusIndicator.textContent = 'Error: Cannot connect to device';
        statusIndicator.className = 'text-red-500 font-bold text-xs';
        showToast("Initial connection failed.");
    }
}

// Boot up the app
init();