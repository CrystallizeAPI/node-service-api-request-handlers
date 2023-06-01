import { createClient } from './client';
import { VippsAppCredentials } from './types';

export const fetchVippsPayment = async (reference: string, credentials: VippsAppCredentials) => {
    const client = await createClient({
        ...credentials,
        fetchToken: true,
    });
    const payment = await client.get<{ state: 'CREATED' | 'AUTHORIZED' | 'TERMINATED' }>(
        `/epayment/v1/payments/${reference}`,
        reference,
    );
    return payment;
};
