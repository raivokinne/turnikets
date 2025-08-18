export const gatesApi = {
    async openGate(gateNumber: number): Promise<void> {
        const response = await fetch(`/api/gate/open/${gateNumber}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to open gate ${gateNumber}`);
        }
    },

    async toggleGate(gateNumber: number): Promise<void> {
        const response = await fetch(`/api/gate/toggle/${gateNumber}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to toggle gate ${gateNumber}`);
        }
    },

    async getGateState(gateNumber: number): Promise<boolean> {
        const response = await fetch(`/api/gate/state/${gateNumber}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get state for gate ${gateNumber}`);
        }

        const data = await response.json();
        return data.isOpen || false;
    },

    async getAllGateStates(): Promise<{ [key: number]: boolean }> {
        try {
            const [gate1State, gate2State] = await Promise.all([
                this.getGateState(1),
                this.getGateState(2)
            ]);

            return {
                1: gate1State,
                2: gate2State
            };
        } catch (error) {
            console.error('Failed to fetch gate states:', error);
            return { 1: false, 2: false };
        }
    }
};