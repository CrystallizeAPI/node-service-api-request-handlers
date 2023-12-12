import { z } from 'zod';
import { Cart } from '../../cart/types';

export const dinteroPaymentPayload = z
    .object({
        cartId: z.string(),
    })
    .strict();

export type DinteroPaymentPayload = z.infer<typeof dinteroPaymentPayload>;

export type DinteroCreateSessionArguments = {
    credentials: DinteroCredentials;
    fetchCart: () => Promise<Cart>;
    returnUrl: string;
    callbackUrl: string;
    otherPaymentArguments?: any;
    customer?: any;
};

export type DinteroCredentials = {
    clientId: string;
    clientSecret: string;
    accountId: string;
    profileId?: string;
};

export type DinteroVerificationPayload = any;

export type DinteroPaymentVerificationArguments = {
    transactionId: string;
    credentials: DinteroCredentials;
    handleEvent: (eventName: string, event: any) => Promise<any>;
};
