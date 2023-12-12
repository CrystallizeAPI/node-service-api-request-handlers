import { z } from 'zod';
import { Cart } from '../../cart/types';

export const dinteroPaymentPayload = z
    .object({
        cartId: z.string(),
    })
    .strict();

export type DinteroPaymentPayload = z.infer<typeof dinteroPaymentPayload>;

export type DinteroAddress = {
    first_name?: string;
    last_name?: string;
    address_line?: string;
    address_line_2?: string;
    co_address?: string;
    business_name?: string;
    postal_code?: string;
    postal_place?: string;
    country?: string;
    phone_number?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    comment?: string;
    organization_number?: string;
    organization_type?: string;
    customer_reference?: string;
    cost_center?: string;
};

export type DinteroCreateSessionArguments = {
    credentials: DinteroCredentials;
    fetchCart: () => Promise<Cart>;
    returnUrl: string;
    callbackUrl: string;
    otherPaymentArguments?: any;
    customer?: {
        email?: string;
        phone?: string;
        shippingAddress?: DinteroAddress;
        billingAddress?: DinteroAddress;
    };
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
