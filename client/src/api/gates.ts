import { api } from '@/utils/api';

export const gatesApi = {
    async openGate(gateNumber: number): Promise<void> {
        const response = await api.post(`/gate/open/${gateNumber}`);

        if (!response.data?.success) {
            throw new Error(`Failed to open gate ${gateNumber}`);
        }
    },

    async toggleGate(gateNumber: number): Promise<void> {
        const response = await api.post(`/gate/toggle/${gateNumber}`);

        if (!response.data?.success) {
            throw new Error(`Failed to toggle gate ${gateNumber}`);
        }
    },

    async getGateState(gateNumber: number): Promise<boolean> {
        const response = await api.get(`/gate/state/${gateNumber}`);
        return response.data?.data?.isOpen || false;
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