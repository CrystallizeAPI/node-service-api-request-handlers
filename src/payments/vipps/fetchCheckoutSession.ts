import { createClient } from './client';
import { fetchVippsPayment } from './fetchPayment';
import { VippsAppCredentials } from './types';

export const fetchVippsCheckoutSession = async (url: string, credentials: VippsAppCredentials) => {
    const client = await createClient({
        ...credentials,
        fetchToken: false,
    });
    const cleanUrl = url.replace(`https://${credentials.origin}`, '');
    const session = await client.get<{
        reference: string;
        sessionId: string;
        sessionState: string;
        paymentDetails?: { state: 'CREATED' | 'AUTHORIZED' | 'TERMINATED' };
    }>(cleanUrl, url);

    if (session.paymentDetails?.state) {
        const payment = await fetchVippsPayment(session.reference, credentials);
        return {
            session,
            payment,
        };
    }
    return {
        session,
        payment: null,
    };
};
