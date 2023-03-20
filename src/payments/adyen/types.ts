import { z } from 'zod';
import { Cart } from '../../cart/types';

export const adyenPaymentPayload = z
    .object({
        cartId: z.string(),
    })
    .strict();

export type AdyenPaymentPayload = z.infer<typeof adyenPaymentPayload>;

export type AdyenCreateSessionArguments = {
    currency: string;
    returnUrl: string;
    merchantAccount: string;
    countryCode: string;
    apiKey: string;
    env: Environment;
    fetchCart: () => Promise<Cart>;
    otherPaymentArguments?: any;
};

export type AdyenWebhookPayload = any;

export type AdyenWebhookArguments = {
    handleEvent: (notificationRequest: any) => Promise<any>;
};
