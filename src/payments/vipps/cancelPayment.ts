import { createClient } from './client';
import { VippsAppCredentials } from './types';

export const cancelVippsPayment = async (orderId: string, credentials: VippsAppCredentials, body: any) => {
    const client = await createClient({
        ...credentials,
        fetchToken: false,
    });
    const cancelConfirmation = await client.put(`/ecomm/v2/payments/${orderId}/cancel`, body, orderId);

    return cancelConfirmation;
};
