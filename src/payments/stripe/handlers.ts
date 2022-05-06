import {
    StripePaymentIntent,
    StripePaymentIntentArguments,
    StripePaymentIntentPayload,
    StripePaymentIntentWebhookArguments,
    StripePaymentIntentWebhookPayload,
} from './types';

import Stripe from 'stripe';

export async function handleStripeCreatePaymentIntentRequestPayload(
    payload: StripePaymentIntentPayload,
    args: StripePaymentIntentArguments,
): Promise<StripePaymentIntent> {
    const stripe = new Stripe(args.secret_key, {
        apiVersion: '2020-08-27',
    });
    const cart = await args.fetchCart();
    const intentArguments = args.createIntentArguments(cart);
    const paymentIntent = await stripe.paymentIntents.create({
        amount: intentArguments.amount,
        currency: intentArguments.currency,
        automatic_payment_methods: {
            enabled: true,
        },
        metadata: intentArguments.metatdata,
        ...(args.otherIntentArguments ? args.otherIntentArguments : {}),
    });

    return {
        key: paymentIntent.client_secret || '',
    };
}

export async function handleStripePaymentIntentWebhookRequestPayload(
    payload: StripePaymentIntentWebhookPayload,
    args: StripePaymentIntentWebhookArguments,
): Promise<any> {
    const stripe = new Stripe(args.secret_key, {
        apiVersion: '2020-08-27',
    });
    const event = stripe.webhooks.constructEvent(args.rawBody, args.signature, args.endpointSecret);
    return await args.handleEvent(event.type, event);
}
