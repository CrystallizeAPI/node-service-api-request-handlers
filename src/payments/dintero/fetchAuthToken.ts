import { DinteroCredentials } from './types';

export const fetchDinteroAuthToken = async (credentials: DinteroCredentials) => {
    const body = JSON.stringify({
        grant_type: 'client_credentials',
        audience: `https://api.dintero.com/v1/accounts/${credentials.accountId}`,
    });
    const result = await fetch(`https://api.dintero.com/v1/accounts/${credentials.accountId}/auth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString(
                'base64',
            )}`,
        },
        body,
    });
    if (!result) {
        throw new Error('Could not fetch Dintero auth token');
    }
    const json = await result.json();
    return json;
};
