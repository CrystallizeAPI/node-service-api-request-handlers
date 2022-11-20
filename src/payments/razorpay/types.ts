import { z } from 'zod';
import { Cart } from '../../cart/types';

export const razorPayPaymentPayload = z
    .object({
        cartId: z.string(),
    })
    .strict();

export type RazorPayPaymentPayload = z.infer<typeof razorPayPaymentPayload>;

export type RazorPayCreateOrderArguments = {
    currency: string;
    credentials: {
        key_id: string;
        key_secret: string;
    };
    fetchCart: () => Promise<Cart>;
    otherPaymentArguments?: any;
};

export type RazorPayVerificationPayload = any;

export type RazorPayPaymentVerificationArguments = {
    orderCreationId: string;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
    key_secret: string;
    key_id: string;
    handleEvent: (eventName: string, event: any) => Promise<any>;
};
