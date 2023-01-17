import jwt from 'jsonwebtoken';
import {
    MontonioCreatePaymentLinkPayload,
    MontonioPaymentLinkArguments,
    MontonioWebhookArguments,
    MontonioWebhookPayload,
} from './types';

export async function handleMontonioCreatePaymentLinkRequestPayload(
    payload: MontonioCreatePaymentLinkPayload,
    args: MontonioPaymentLinkArguments,
): Promise<{ url: string }> {
    const cart = await args.fetchCart();
    const paymentArguments = args.createPaymentArguments(cart);

    const montonioPayload = {
        amount: paymentArguments.amount,
        currency: paymentArguments.currency.toLocaleUpperCase(),
        access_key: args.access_key,
        merchant_reference: payload.cartId,
        merchant_return_url: paymentArguments.urls.return,
        merchant_notification_url: paymentArguments.urls.notification,
        payment_information_unstructured: `Payment for cart ${payload.cartId}`,
        checkout_email: paymentArguments.customer.email,
        checkout_phone_number: paymentArguments.customer.phone,
        checkout_first_name: paymentArguments.customer.firstName,
        checkout_last_name: paymentArguments.customer.lastName,
        ...(args.otherPaymentArgumentsForLink ? args.otherPaymentArgumentsForLink : {}),
    };
    const token = jwt.sign(montonioPayload, args.secret_key, { algorithm: 'HS256', expiresIn: '10m' });
    return { url: `https://${args.origin}?payment_token=${token}` };
}

export async function handleMontonioPaymentUpdateWebhookRequestPayload(
    payload: MontonioWebhookPayload,
    args: MontonioWebhookArguments,
): Promise<any> {
    const decoded = jwt.verify(args.token, args.secret_key);
    return await args.handleEvent(decoded);
}
