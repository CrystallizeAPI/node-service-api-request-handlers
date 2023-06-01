import { createClient } from './client';
import { AddReceiptToOrderArgs, VippsAppCredentials } from './types';

export const addVippsReceiptOrder = async (
    { orderId, paymentType, receipt }: AddReceiptToOrderArgs,
    credentials: VippsAppCredentials,
) => {
    const client = await createClient({
        ...credentials,
        fetchToken: true,
    });
    const payment = await client.post<{ state: 'CREATED' | 'AUTHORIZED' | 'TERMINATED' }>(
        `/order-management/v2/${paymentType}/receipts/${orderId}`,
        receipt,
        orderId,
    );
    return payment;
};
