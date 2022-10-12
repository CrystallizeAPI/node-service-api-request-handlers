import { createClient } from './client';
import {
    QuickPayCreatePaymentLinkArguments,
    QuickPayCreatePaymentLinkPayload,
    QuickPayWebhookArguments,
    QuickPayWebhookPayload,
} from './types';
import crypto from 'crypto';

export async function handleQuickPayCreatePaymentLinkRequestPayload(
    payload: QuickPayCreatePaymentLinkPayload,
    args: QuickPayCreatePaymentLinkArguments,
): Promise<{ url: string }> {
    const client = createClient(args.api_key);
    const cart = await args.fetchCart();
    const paymentArguments = args.createPaymentArguments(cart);

    const defaultVariables = {
        cartId: payload.cartId,
    };

    const payment = await client.post<{ id: string }>('https://api.quickpay.net/payments', {
        // there is a limit 20 characters for the order_id on QuickPay
        order_id: crypto.createHash('md5').update(payload.cartId).digest('hex').substring(0, 20),
        currency: paymentArguments.currency,
        variables: {
            ...defaultVariables,
            ...(paymentArguments.extra ? paymentArguments.extra : {}),
        },
        ...(args.otherPaymentArgumentsForPayment ? args.otherPaymentArgumentsForPayment : {}),
    });

    const link = await client.put<{ url: string }>('https://api.quickpay.net/payments/' + payment.id + '/link', {
        amount: paymentArguments.amount,
        continue_url: paymentArguments.urls.continue,
        cancel_url: paymentArguments.urls.cancel,
        callback_url: paymentArguments.urls.callback,
        ...(args.otherPaymentArgumentsForLink ? args.otherPaymentArgumentsForLink : {}),
    });

    return {
        url: link.url,
    };
}

export async function handleQuickPayPaymentUpdateWebhookRequestPayload(
    payload: QuickPayWebhookPayload,
    args: QuickPayWebhookArguments,
): Promise<any> {
    const checksum = args.signature;
    const bodyAsString = JSON.stringify(args.rawBody);
    const bodyHashed = crypto.createHmac('sha256', args.private_key).update(bodyAsString).digest('hex');

    if (checksum !== bodyHashed) {
        console.error('Signature is not valid');
        return {};
    }

    return await args.handleEvent(payload);
}
