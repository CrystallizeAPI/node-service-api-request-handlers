import { z } from 'zod';
import { Cart } from '../../cart/types';

export const klarnaInitiatePaymentPayload = z
    .object({
        cartId: z.string(),
    })
    .strict();

export type KlarnaInitiatePaymentPayload = z.infer<typeof klarnaInitiatePaymentPayload>;

export type KlarnaInitiatePaymentArguments = {
    origin: string;
    country: string;
    locale: string;
    credentials: {
        username: string;
        password: string;
    };
    fetchCart: () => Promise<Cart>;
    initiatePaymentArguments: (cart: Cart) => {
        currency: string;
        amount: number;
        order_lines: Array<{
            name: string;
            quantity: number;
            total_amount: number;
            unit_price: number;
        }>;
        extra?: {
            [key: string]: any;
        };
        urls: {
            confirmation: string;
            authorization: string;
        };
    };
    otherPaymentArguments?: any;
};

export type KlarnaWebhookPayload = {
    session_id: string;
    authorization_token: string;
};

export type KlarnaWebhookArguments = {
    origin: string;
    country: string;
    locale: string;
    cartId: string;
    credentials: {
        username: string;
        password: string;
    };
    fetchCart: () => Promise<Cart>;
    confirmPaymentArguments: (cart: Cart) => {
        currency: string;
        amount: number;
        order_lines: Array<{
            name: string;
            quantity: number;
            total_amount: number;
            unit_price: number;
        }>;
        extra?: {
            [key: string]: any;
        };
    };
    handleEvent: (klarnaOrder: any) => Promise<any>;
};

export type KlarnaPaymentMethod = {
    asset_urls: {
        standard: string;
    };
    identifier: string;
    name: string;
};

export type KlarnaPaymentResponse = {
    client_token: string;
    session_id: string;
    payment_method_categories: KlarnaPaymentMethod[];
};

export type KlarnaOrderResponse = {
    order_id: string;
    fraud_status: string;
    authorized_payment_method: string;
};
