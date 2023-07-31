import { createClient } from './client';
import { VippsAppCredentials } from './types';

export const refundVippsPayment = async (orderId: string, credentials: VippsAppCredentials, body: any) => {
    const client = await createClient({
        ...credentials,
        fetchToken: false,
    });
    const refundConfirmation = await client.post(`/ecomm/v2/payments/${orderId}/refund`, body, orderId);

    return refundConfirmation;
};
