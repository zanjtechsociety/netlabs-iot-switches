import CONFIG from './config.js';
import { simulatedApi } from './simulation.js';

export const dimmerApi = {
    /**
     * Set the brightness level (0-100)
     */
    async setBrightness(level) {
        if (CONFIG.useSimulation) {
            return await simulatedApi.setBrightness(level);
        }

        try {
            const response = await fetch(`${CONFIG.deviceIp}/dimmer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level })
            });
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Fetch API Error:", error);
            throw error;
        }
    },

    /**
     * Toggle main power on/off
     */
    async togglePower(state) {
        if (CONFIG.useSimulation) {
            return await simulatedApi.togglePower(state);
        }

        try {
            const response = await fetch(`${CONFIG.deviceIp}/power`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ power: state })
            });
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Fetch API Error:", error);
            throw error;
        }
    },

    /**
     * Get current device status
     */
    async getStatus() {
        if (CONFIG.useSimulation) {
            return await simulatedApi.getStatus();
        }

        try {
            const response = await fetch(`${CONFIG.deviceIp}/status`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Fetch API Error:", error);
            throw error;
        }
    }
};