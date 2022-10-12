import { Cart } from '../../cart/types';
import { z } from 'zod';
import Stripe from 'stripe';

export const stripePaymentIntentPayload = z
    .object({
        cartId: z.string(),
    })
    .strict();

export type StripePaymentIntent = {
    key: string;
};

export type StripePaymentIntentPayload = z.infer<typeof stripePaymentIntentPayload>;

export type StripePaymentIntentArguments = {
    secret_key: string;
    fetchCart: () => Promise<Cart>;
    createIntentArguments: (cart: Cart) => {
        amount: number;
        currency: string;
        metatdata?: Stripe.MetadataParam;
    };
    otherIntentArguments?: Stripe.PaymentIntentCreateParams;
};

export type StripePaymentIntentWebhookPayload = any;

export type StripePaymentIntentWebhookArguments = {
    secret_key: string;
    endpointSecret: string;
    signature: string;
    rawBody: string;
    handleEvent: (eventName: string, event: any) => Promise<any>;
};
