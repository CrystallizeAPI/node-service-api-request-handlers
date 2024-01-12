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
    customer?: {
        email?: string;
        phone?: string;
        shippingAddress?: DinteroAddress;
        billingAddress?: DinteroAddress;
    };
    express?: {
        enabled: boolean;
        expressCheckoutOptions: ExpressShipping;
    };
    otherPaymentArguments?: any;
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

type Eta = {
    starts_at: string;
    ends_at: string;
};

type TimeSlot = {
    starts_at: string;
    ends_at: string;
};

type Metadata = {
    operator_dest: string;
    number_x: number;
};

type Details = {
    label: string;
    value: string;
};

type EnvironmentalData = {
    description: string;
    details: Details[];
};

type ShippingOption = {
    id: string;
    line_id: string;
    countries?: string[];
    amount: number;
    vat_amount?: number;
    vat?: number;
    title: string;
    description?: string;
    delivery_method?: 'delivery' | 'pick_up' | 'unspecified' | 'none';
    operator: string;
    operator_product_id?: string;
    eta?: Eta;
    time_slot?: TimeSlot;
    pick_up_address?: DinteroAddress;
    metadata?: Metadata;
    environmental_data?: EnvironmentalData;
};

type DiscountCodes = {
    max_count: number;
    callback_url: string;
};

type ExpressShipping = {
    shipping_options: ShippingOption[];
    shipping_mode?: string;
    discount_codes?: DiscountCodes;
    shipping_address_callback_url?: string;
    customer_types?: ('b2c' | 'b2b')[];
};
