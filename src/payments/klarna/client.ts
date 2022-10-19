import fetch from 'node-fetch';

const fetchResult = async (url: string, init?: RequestInit | any | undefined): Promise<any> => {
    const response = await fetch(url, {
        ...init,
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
            Accept: 'application/json',
            ...(init.headers ? init.headers : {}),
        },
    });

    if (!response.ok) {
        console.error('Klarna', await response.text());
        throw new Error(`Could not fetch ${url}. Response from Klarna is NOT OK.`);
    }
    return await response.json();
};

export type ClientInterface = ReturnType<typeof createClient>;

export const createClient = (username: string, password: string) => {
    const authKey = Buffer.from(`${username}:${password}`).toString('base64');
    const authHeader = {
        headers: {
            Authorization: `Basic ${authKey}`,
        },
    };
    return {
        get: async <T>(input: string, init?: RequestInit): Promise<T> => {
            return fetchResult(input, {
                ...authHeader,
                ...init,
            });
        },
        post: async <T>(input: string, body: any, init?: RequestInit): Promise<T> => {
            return fetchResult(input, {
                method: 'POST',
                ...authHeader,
                body: JSON.stringify(body),
                ...init,
            });
        },
        put: async <T>(input: string, body: any, init?: RequestInit): Promise<T> => {
            return fetchResult(input, {
                method: 'PUT',
                ...authHeader,
                body: JSON.stringify(body),
                ...init,
            });
        },
    };
};
