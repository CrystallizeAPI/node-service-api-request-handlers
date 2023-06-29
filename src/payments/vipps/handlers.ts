import jwt from 'jsonwebtoken';
import { createClient } from './client';
import { fetchVippsTokenFromOAuthCode } from './fetchTokenFromOAuthCode';
import { fetchVippsUserInfoFromOAuthToken } from './fetchUserInfoFromOAuthToken';
import {
    VippsCreateCheckoutSessionArguments,
    VippsCreateCheckoutSessionResponse,
    VippsInitiateExpressCheckoutArguments,
    VippsInitiateExpressCheckoutPayload,
    VippsInitiateExpressCheckoutResponse,
    VippsInitiatePaymentArguments,
    VippsInitiatePaymentPayload,
    VippsInitiatePaymentResponse,
    VippsLoginOAuthArguments,
    VippsLoginOAuthPayload,
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

export async function handleVippsInitiateExpressCheckoutRequestPayload(
    payload: VippsInitiateExpressCheckoutPayload,
    args: VippsInitiateExpressCheckoutArguments,
): Promise<VippsInitiateExpressCheckoutResponse> {
    const client = await createClient({
        fetchToken: true,
        origin: args.origin,
        clientId: args.clientId,
        clientSecret: args.clientSecret,
        subscriptionKey: args.subscriptionKey,
        merchantSerialNumber: args.merchantSerialNumber,
    });

    const cart = await args.fetchCart();
    const body = {
        customerInfo: {
            ...(payload.mobileNumber ? { mobileNumber: payload.mobileNumber } : {}),
        },
        merchantInfo: {
            merchantSerialNumber: args.merchantSerialNumber,
            callbackPrefix: args.callbackPrefix,
            fallBack: args.fallback,
            consentRemovalPrefix: args.consentRemovalPrefix,
            paymentType: 'eComm Express Payment', // the case of that string is important
            ...args.extraMerchantInfo,
        },
        transaction: {
            amount: cart.total.gross * 100,
            transactionText: cart.cart.items
                .map((item) => item.variant.name || item.product.name || item.variant.sku)
                .join(', '),
            timeStamp: new Date().toISOString(),
            orderId: payload.cartId,
        },
    };
    return await client.post<VippsInitiateExpressCheckoutResponse>(`/ecomm/v2/payments`, body, 'payload.cartId');
}

export async function handleVippsLoginOAuthRequestPayload(
    payload: VippsLoginOAuthPayload,
    args: VippsLoginOAuthArguments,
): Promise<string> {
    if (payload.state !== args.expectedState) {
        throw new Error('The state does not match');
    }

    const credentials = {
        origin: args.origin,
        clientId: args.clientId,
        clientSecret: args.clientSecret,
        subscriptionKey: args.subscriptionKey,
        merchantSerialNumber: args.merchantSerialNumber,
    };
    const token = await fetchVippsTokenFromOAuthCode(payload.code, args.redirectUri, credentials);
    const userInfos = await fetchVippsUserInfoFromOAuthToken<{
        email: string;
        given_name: string;
        family_name: string;
    }>(token, credentials);

    if (args.onUserInfos) {
        await args.onUserInfos(userInfos);
    }

    const jwtPayload = {
        email: userInfos.email,
        firstname: userInfos.given_name ?? '',
        lastname: userInfos.family_name ?? '',
    };

    // now we create 2 tokens, one for the frontend to indicate that we are logged in and one for the service api in the Cookie
    // the token for the frontend is NOT a prood of login
    const isSupposedToBeLoggedInOnServiceApiToken = jwt.sign(jwtPayload, args.jwtSecret, {
        expiresIn: '1d',
        audience: userInfos.email,
        subject: 'isSupposedToBeLoggedInOnServiceApi',
        issuer: `${args.host} via Vipps Login`,
    });

    const isLoggedInOnServiceApiToken = jwt.sign(jwtPayload, args.jwtSecret, {
        expiresIn: '1d',
        audience: userInfos.email,
        subject: 'isLoggedInOnServiceApiToken',
        issuer: `${args.host} via Vipps Login`,
    });
    args.setCookie('jwt', isLoggedInOnServiceApiToken);
    return args.backLinkPath.replace(':token', isSupposedToBeLoggedInOnServiceApiToken);
}
