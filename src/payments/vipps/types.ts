import { z } from 'zod';
import { Cart } from '../../cart/types';

export const vippsInitiatePaymentPayload = z
    .object({
        cartId: z.string(),
    })
    .strict();

export type VippsInitiatePaymentPayload = z.infer<typeof vippsInitiatePaymentPayload>;

export type VippsAppCredentials = {
    origin: string;
    clientId: string;
    clientSecret: string;
    subscriptionKey: string;
    merchantSerialNumber: string;
};

export type VippsInitiatePaymentArguments = VippsAppCredentials & {
    fetchCart: () => Promise<Cart>;
    createIntentArguments: (cart: Cart) => {
        amount: number;
        currency: string;
        paymentMethod: 'WALLET' | 'CARD';
        returnUrl: string;
        userFlow: 'PUSH_MESSAGE' | 'NATIVE_REDIRECT' | 'WEB_REDIRECT' | 'QR';
    };
    otherIntentArguments?: Record<string, any>;
};

export type VippsInitiatePaymentResponse = {
    redirectUrl?: string;
    reference: string;
};

export type VippsCreateCheckoutSessionArguments = VippsAppCredentials & {
    fetchCart: () => Promise<Cart>;
    createCheckoutArguments: (cart: Cart) => {
        amount: number;
        currency: string;
        callbackUrl: string;
        returnUrl: string;
        callbackAuthorizationToken: string;
        paymentDescription: string;
    };
    otherCheckoutArguments?: Record<string, any>;
};

export type VippsCreateCheckoutSessionResponse = {
    token: string;
    checkoutFrontendUrl: string;
    pollingUrl: string;
};

export type VippsInitiateExpressCheckoutPayload = {
    cartId: string;
    mobileNumber?: string;
};
export type VippsInitiateExpressCheckoutArguments = VippsAppCredentials & {
    callbackPrefix: string;
    fallback: string;
    consentRemovalPrefix: string;
    extraMerchantInfo?: any;
    fetchCart: () => Promise<Cart>;
};
export type VippsInitiateExpressCheckoutResponse = {
    orderId: string;
    url: string;
};

// this does not exist yet, we fake it for now
// we are actually polling and we will force all that function directly (without any webhook)
export type VippsWebhookPayload = any;
export type VippsWebhookArguments = {
    handleEvent: (event: any) => Promise<any>;
};

export type VippsReceipt = {
    orderLines: Array<{
        name: string;
        id: string;
        totalAmount: number;
        totalAmountExcludingTax: number;
        totalTaxAmount: number;
        taxPercentage: number;
        unitInfo?: {
            unitPrice: number;
            quantity: number;
            quantityUnit: 'PCS' | 'KG' | 'KM' | 'MINUTE' | 'LITRE' | 'KWH';
        };
        discount?: number;
        productUrl?: string;
        isReturn?: boolean;
        isShipping?: boolean;
    }>;
    bottomLine: {
        currency: string;
        tipAmount?: number;
        posId?: string;
        paymentSources?: {
            giftCard?: number;
            card?: number;
            voucher?: number;
            cash?: number;
        };
        barcode?: {
            format: 'EAN-13' | 'CODE 39' | 'CODE 128';
            data: string;
        };
        receiptNumber?: string;
    };
};

export type AddReceiptToOrderArgs = {
    orderId: string;
    paymentType: 'ecom' | 'recurring';
    receipt: VippsReceipt;
};

export type VippsLoginOAuthPayload = {
    code: string;
    state: string;
};

export type VippsLoginOAuthArguments = VippsAppCredentials & {
    jwtSecret: string;
    host: string;
    expectedState: string;
    backLinkPath: string;
    redirectUri: string;
    setCookie: (name: string, value: string) => void;
    onUserInfos?: (userInfos: any) => Promise<any>;
};
