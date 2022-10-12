import { z } from 'zod';
import { Cart } from '../../cart/types';

export const quickPayCreatePaymentLinkPayload = z
    .object({
        cartId: z.string(),
    })
    .strict();

export type QuickPayCreatePaymentLinkPayload = z.infer<typeof quickPayCreatePaymentLinkPayload>;

export type QuickPayCreatePaymentLinkArguments = {
    fetchCart: () => Promise<Cart>;
    createPaymentArguments: (cart: Cart) => {
        amount: number;
        currency: string;
        urls: {
            continue: string;
            cancel: string;
            callback: string;
        };
        extra?: {
            [key: string]: any;
        };
    };
    otherPaymentArgumentsForPayment?: any;
    otherPaymentArgumentsForLink?: any;
    api_key: string;
};

export type QuickPayWebhookPayload = any;

export type QuickPayWebhookArguments = {
    private_key: string;
    signature: string;
    rawBody: string;
    handleEvent: (event: QuickPayWebhookPayload) => Promise<any>;
};
