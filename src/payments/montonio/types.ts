import { z } from 'zod';
import { Cart } from '../../cart/types';

export const montonioCreatePaymentLinkPayload = z
    .object({
        cartId: z.string(),
    })
    .strict();

export type MontonioCreatePaymentLinkPayload = z.infer<typeof montonioCreatePaymentLinkPayload>;

export type MontonioPaymentLinkArguments = {
    origin: string;
    access_key: string;
    secret_key: string;
    fetchCart: () => Promise<Cart>;
    createPaymentArguments: (cart: Cart) => {
        amount: number;
        currency: string;
        urls: {
            return: string;
            notification: string;
        };
        customer: {
            email: string;
            firstName: string;
            lastName: string;
            phone?: string;
        };
    };
    otherPaymentArgumentsForLink?: any;
};

export type MontonioWebhookPayload = any;

export type MontonioWebhookArguments = {
    secret_key: string;
    token: string;
    handleEvent: (event: MontonioWebhookPayload) => Promise<any>;
};
