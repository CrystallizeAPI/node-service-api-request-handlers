import { createClient } from './client';
import { VippsAppCredentials } from './types';

export const fetchVippsUserInfoFromOAuthToken = async <T>(token: string, credentials: VippsAppCredentials) => {
    const client = await createClient({
        ...credentials,
        fetchToken: false,
        oauthToken: token,
    });
    const oauthResponse = await client.get<T>(`/vipps-userinfo-api/userinfo/`, '');
    return oauthResponse;
};
