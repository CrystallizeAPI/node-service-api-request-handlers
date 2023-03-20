import { Client, CheckoutAPI } from '@adyen/api-library';
import { AdyenCreateSessionArguments, AdyenPaymentPayload, AdyenWebhookArguments, AdyenWebhookPayload } from './types';

export async function handleAdyenPaymentSessionPayload(
    payload: AdyenPaymentPayload,
    args: AdyenCreateSessionArguments,
): Promise<{ sessionId: string; data: any }> {
    const cart = await args.fetchCart();

    const client = new Client({
        apiKey: args.apiKey,
        environment: args.env,
    });

    const checkout = new CheckoutAPI(client);

    const response = await checkout.sessions({
        amount: {
            currency: args.currency,
            value: cart.total.gross * 100,
        },
        countryCode: args.countryCode,
        merchantAccount: args.merchantAccount,
        reference: payload.cartId,
        returnUrl: args.returnUrl,
    });

    if (!response) {
        throw new Error('Session not created');
    }

    return {
        sessionId: response.id,
        data: response,
    };
}

export async function handleAdyenWebhookRequestPayload(
    payload: AdyenWebhookPayload,
    args: AdyenWebhookArguments,
): Promise<any> {
    return await args.handleEvent(payload);
}
