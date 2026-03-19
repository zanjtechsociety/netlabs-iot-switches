// Mock internal state for the dimmer
let mockDeviceState = {
    power: true,
    brightness: 50
};

// Helper to simulate network latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const simulatedApi = {
    async setBrightness(level) {
        await delay(150); // Simulate network round-trip
        mockDeviceState.brightness = level;
        console.log(`[SIM] API: Brightness set to ${level}%`);
        return { status: "success", data: { ...mockDeviceState } };
    },

    async togglePower(state) {
        await delay(150);
        mockDeviceState.power = state;
        console.log(`[SIM] API: Power set to ${state ? 'ON' : 'OFF'}`);
        return { status: "success", data: { ...mockDeviceState } };
    },

    async getStatus() {
        await delay(100);
        console.log(`[SIM] API: Fetched status`, mockDeviceState);
        return { status: "success", data: { ...mockDeviceState } };
    }
};