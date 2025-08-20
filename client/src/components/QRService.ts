import { api } from "@/utils/api";
import { v4 as uuidv4 } from 'uuid';

interface SendEmailParams {
    to: string;
    attachmentUrl?: string;
    data?: string;
    id: number;
    name: string;
    class: string;
}

export const QRService = {
    /**
     * Generate a QR code URL using the api.qrserver.com service
     * @param data The data to encode in the QR code
     * @param size The size of the QR code (default: 200x200)
     * @param margin The margin around the QR code (default: 30)
     * @returns URL of the generated QR code
     */
    generateQRCodeUrl: (
        data: string,
        size: string = "200x200",
        margin: number = 30,
    ): string => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${data}&margin=${margin}`;
    },

    /**
     * Generate a unique QR code data string for a student
     * @param studentId Student's ID
     * @param studentName Student's name
     * @param studentClass Student's class
     * @returns A unique string to be encoded in the QR code
     */
    generateQRCodeData: (
        studentId: number,
        studentName: string,
        studentClass: string,
    ): string => {
        const uuid = uuidv4();
        return JSON.stringify({
            id: studentId,
            name: studentName,
            class: studentClass,
            uuid: uuid,
            timestamp: new Date().toISOString()
        });
    },

    sendEmail: async (params: SendEmailParams): Promise<boolean> => {
        const res = await api.post(`/qr/store`, params);

        if (res.status === 200) {
            return true;
        }
        return false;
    },

    /**
     * Send a QR code to a student via email
     * @param studentName Student's name
     * @param studentClass Student's class
     * @param studentEmail Student's email
     * @param studentId Student's ID
     * @returns Promise that resolves when QR code is sent
     */
    sendQRCodeToStudent: async (
        studentName: string,
        studentClass: string,
        studentEmail: string,
        studentId: number,
    ): Promise<boolean> => {
        try {
            const qrData = QRService.generateQRCodeData(
                studentId,
                studentName,
                studentClass,
            );

            const qrUrl = QRService.generateQRCodeUrl(qrData);

            await QRService.sendEmail({
                to: studentEmail,
                attachmentUrl: qrUrl,
                data: qrData,
                name: studentName,
                id: studentId,
                class: studentClass,
            });

            return true;
        } catch (error) {
            console.error("Error sending QR code:", error);
            return false;
        }
    },
};

export default QRService;
