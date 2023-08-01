import { createClient } from './client';
import { VippsAppCredentials } from './types';

export const captureVippsPayment = async (orderId: string, credentials: VippsAppCredentials, body: any) => {
    const client = await createClient({
        ...credentials,
        fetchToken: false,
    });
    const capturedConfirmation = await client.post(`/ecomm/v2/payments/${orderId}/capture`, body, orderId);

    return capturedConfirmation;
};
