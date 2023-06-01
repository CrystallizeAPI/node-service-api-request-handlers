import { createClient } from './client';
import {
    VippsCreateCheckoutSessionArguments,
    VippsCreateCheckoutSessionResponse,
    VippsInitiatePaymentArguments,
    VippsInitiatePaymentPayload,
    VippsInitiatePaymentResponse,
    VippsWebhookArguments,
    VippsWebhookPayload,
} from './types';

export async function handleVippsInitiatePaymentRequestPayload(
    payload: VippsInitiatePaymentPayload,
    args: VippsInitiatePaymentArguments,
): Promise<VippsInitiatePaymentResponse> {
    const cart = await args.fetchCart();
    const client = await createClient({
        fetchToken: true,
        origin: args.origin,
        clientId: args.clientId,
        clientSecret: args.clientSecret,
        subscriptionKey: args.subscriptionKey,
        merchantSerialNumber: args.merchantSerialNumber,
    });

    const paymentArguments = args.createIntentArguments(cart);

    const body = {
        amount: {
            currency: paymentArguments.currency,
            value: paymentArguments.amount,
        },
        paymentMethod: {
            type: paymentArguments.paymentMethod,
        },
        returnUrl: paymentArguments.returnUrl,
        reference: payload.cartId,
        userFlow: paymentArguments.userFlow,
        ...(args.otherIntentArguments ? args.otherIntentArguments : {}),
    };
    return await client.post<VippsInitiatePaymentResponse>(`/epayment/v1/payments`, body, payload.cartId);
}

export async function handleVippsCreateCheckoutSessionRequestPayload(
    payload: VippsInitiatePaymentPayload,
    args: VippsCreateCheckoutSessionArguments,
): Promise<VippsCreateCheckoutSessionResponse> {
    const cart = await args.fetchCart();
    const client = await createClient({
        fetchToken: false,
        origin: args.origin,
        clientId: args.clientId,
        clientSecret: args.clientSecret,
        subscriptionKey: args.subscriptionKey,
        merchantSerialNumber: args.merchantSerialNumber,
    });

    const paymentArguments = args.createCheckoutArguments(cart);

    const body = {
        merchantInfo: {
            callbackUrl: paymentArguments.callbackUrl,
            returnUrl: paymentArguments.returnUrl,
            callbackAuthorizationToken: paymentArguments.callbackAuthorizationToken,
        },
        transaction: {
            amount: {
                value: paymentArguments.amount,
                currency: paymentArguments.currency,
            },
            reference: payload.cartId,
            paymentDescription: paymentArguments.paymentDescription,
        },
        ...(args.otherCheckoutArguments ? args.otherCheckoutArguments : {}),
    };
    return await client.post<VippsCreateCheckoutSessionResponse>(`/checkout/v3/session`, body, payload.cartId);
}

export async function handleVippsPayPaymentUpdateWebhookRequestPayload(
    payload: VippsWebhookPayload,
    args: VippsWebhookArguments,
): Promise<any> {
    // we need a bit of security here in the feature when it will be a real webhook that is implemented
    // here we just call the handleEvent function directly
    return await args.handleEvent(payload);
}
