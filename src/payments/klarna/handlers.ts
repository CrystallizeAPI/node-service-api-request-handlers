import { createClient } from './client';
import {
    KlarnaInitiatePaymentArguments,
    KlarnaInitiatePaymentPayload,
    KlarnaOrderResponse,
    KlarnaPaymentResponse,
    KlarnaWebhookArguments,
    KlarnaWebhookPayload,
} from './types';

export async function handleKlarnaInitiatePaymentRequestPayload(
    payload: KlarnaInitiatePaymentPayload,
    args: KlarnaInitiatePaymentArguments,
): Promise<KlarnaPaymentResponse> {
    const cart = await args.fetchCart();
    const apiURL = `https://${args.origin}`;
    const client = createClient(args.credentials.username, args.credentials.password);
    const paymentArguments = args.initiatePaymentArguments(cart);

    const body = {
        merchant_reference1: payload.cartId,
        order_amount: paymentArguments.amount,
        order_lines: paymentArguments.order_lines,
        purchase_country: args.country,
        locale: args.locale,
        purchase_currency: paymentArguments.currency,
        intent: 'buy',
        merchant_urls: {
            confirmation: paymentArguments.urls.confirmation,
            authorization: paymentArguments.urls.authorization,
        },
        ...(paymentArguments.extra ? paymentArguments.extra : {}),
        ...(args.otherPaymentArguments ? args.otherPaymentArguments : {}),
    };
    return await client.post<KlarnaPaymentResponse>(`${apiURL}/payments/v1/sessions`, body);
}

export async function handleKlarnaPaymentWebhookRequestPayload(
    payload: KlarnaWebhookPayload,
    args: KlarnaWebhookArguments,
): Promise<any> {
    const cart = await args.fetchCart();
    const apiURL = `https://${args.origin}`;
    const client = createClient(args.credentials.username, args.credentials.password);
    const paymentArguments = args.confirmPaymentArguments(cart);

    const body = {
        merchant_reference1: args.cartId,
        order_amount: paymentArguments.amount,
        order_lines: paymentArguments.order_lines,
        purchase_country: args.country,
        locale: args.locale,
        purchase_currency: paymentArguments.currency,
        ...(paymentArguments.extra ? paymentArguments.extra : {}),
    };
    const response = await client.post<KlarnaOrderResponse>(
        `${apiURL}/payments/v1/authorizations/${payload.authorization_token}/order`,
        body,
    );
    return await args.handleEvent(response);
}
