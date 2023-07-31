import fetch from 'node-fetch';
import { VippsAppCredentials } from './types';

const fetchResult = async (url: string, init?: RequestInit | any | undefined): Promise<any> => {
    const headers = {
        'Content-type': 'application/json; charset=UTF-8',
        Accept: 'application/json',
        'Vipps-System-Name': 'Crystallize OSS Integration',
        'Vipps-System-Version': '0.0.0',
        'Vipps-System-Plugin-Name': 'crystallize-oss-integration',
        'Vipps-System-Plugin-Version': '0.0.0',
        ...(init.headers ? init.headers : {}),
    };

    const response = await fetch(url, {
        ...init,
        headers,
    });

    if (!response.ok) {
        console.error('Vipps', await response.text());
        throw new Error(`Could not fetch ${url}. Response from Vipps is NOT OK.`);
    }
    return await response.json();
};

export type ClientInterface = Awaited<ReturnType<typeof createClient>>;

type Credentials = VippsAppCredentials & {
    extraHeaders?: Record<string, string>;
    fetchToken?: boolean;
    oauthConnect?: boolean;
    oauthToken?: string;
};

async function getAuthHeaders({
    origin,
    clientId,
    clientSecret,
    subscriptionKey,
    merchantSerialNumber,
    fetchToken,
    oauthConnect,
    oauthToken,
}: Credentials) {
    if (oauthConnect) {
        return {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'Merchant-Serial-Number': merchantSerialNumber,
        };
    }

    if (oauthToken) {
        return {
            Authorization: `Bearer ${oauthToken}`,
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Merchant-Serial-Number': merchantSerialNumber,
        };
    }

    if (fetchToken) {
        const response = await fetchResult(`https://${origin}/accesstoken/get`, {
            method: 'POST',
            headers: {
                client_id: clientId,
                client_secret: clientSecret,
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                'Merchant-Serial-Number': merchantSerialNumber,
            },
        });
        return {
            Authorization: `Bearer ${response.access_token}`,
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Merchant-Serial-Number': merchantSerialNumber,
        };
    }

    return {
        client_id: clientId,
        client_secret: clientSecret,
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Merchant-Serial-Number': merchantSerialNumber,
    };
}

export const createClient = async ({
    origin,
    clientId,
    clientSecret,
    subscriptionKey,
    merchantSerialNumber,
    extraHeaders,
    fetchToken,
    oauthConnect,
    oauthToken,
}: Credentials) => {
    const authHeaders = await getAuthHeaders({
        origin,
        clientId,
        clientSecret,
        subscriptionKey,
        merchantSerialNumber,
        fetchToken,
        oauthConnect,
        oauthToken,
    });
    return {
        get: async <T>(endpoint: string, idempotencyKey: string, init?: RequestInit): Promise<T> => {
            return fetchResult(`https://${origin}${endpoint}`, {
                headers: {
                    ...(idempotencyKey.length > 0 ? { 'Idempotency-Key': idempotencyKey } : {}),
                    ...authHeaders,
                    ...extraHeaders,
                },
                ...init,
            });
        },
        post: async <T>(endpoint: string, body: any, idempotencyKey: string, init?: RequestInit): Promise<T> => {
            return fetchResult(`https://${origin}${endpoint}`, {
                method: 'POST',
                headers: {
                    ...(idempotencyKey.length > 0 ? { 'Idempotency-Key': idempotencyKey } : {}),
                    ...authHeaders,
                    ...extraHeaders,
                },
                body: JSON.stringify(body),
                ...init,
            });
        },
        put: async <T>(endpoint: string, body: any, idempotencyKey: string, init?: RequestInit): Promise<T> => {
            return fetchResult(`https://${origin}${endpoint}`, {
                method: 'PUT',
                headers: {
                    ...(idempotencyKey.length > 0 ? { 'Idempotency-Key': idempotencyKey } : {}),
                    ...authHeaders,
                    ...extraHeaders,
                },
                body: JSON.stringify(body),
                ...init,
            });
        },
        formEncodedPost: async <T>(
            endpoint: string,
            body: any,
            idempotencyKey: string,
            init?: RequestInit,
        ): Promise<T> => {
            return fetchResult(`https://${origin}${endpoint}`, {
                method: 'POST',
                headers: {
                    ...(idempotencyKey.length > 0 ? { 'Idempotency-Key': idempotencyKey } : {}),
                    ...authHeaders,
                    ...extraHeaders,
                    'Content-type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(body),
                ...init,
            });
        },
    };
};
