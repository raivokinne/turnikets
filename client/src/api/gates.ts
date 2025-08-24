import { api } from '@/utils/api';

interface GateState {
    isOpen: boolean;
    isOnline: boolean;
}

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

    async getGateState(gateNumber: number): Promise<GateState> {
        const response = await api.get(`/gate/state/${gateNumber}`);
        const data = response.data?.data;

        return {
            isOpen: data?.isOpen || false,
            isOnline: data?.isOnline || false
        };
    },

    async getAllGateStates(): Promise<{ [key: number]: GateState }> {
        try {
            const response = await api.get('/gate/states');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch gate states:', error);
            return {
                1: { isOpen: false, isOnline: false },
                2: { isOpen: false, isOnline: false }
            };
        }
    }
};