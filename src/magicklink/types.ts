import { z } from 'zod';

export const magickLinkUserInfosPayload = z
    .object({
        email: z.string(),
        firstname: z.string(),
        lastname: z.string(),
    })
    .strict();

export type MagickLinkUserInfosPayload = z.infer<typeof magickLinkUserInfosPayload>;
export type MagickLinkUserInfos = MagickLinkUserInfosPayload;

type UserIdentifierSelector<T extends MagickLinkUserInfosPayload> = (payload: T) => string;

export type MagickLinkRegisterArguments<T extends MagickLinkUserInfosPayload> = {
    host: string;
    mailer: (subject: string, to: string[] | string, from: string, html: string) => void;
    jwtSecret: string;
    confirmLinkUrl: string;
    subject: string;
    from: string;
    buildHtml: (request: MagickLinkUserInfos, link: string) => string;
    userIdentifierSelector?: UserIdentifierSelector<T>;
};

export type MagickLinkConfirmArguments<T extends MagickLinkUserInfosPayload> = {
    jwtSecret: string;
    backLinkPath: string;
    token: string;
    host: string;
    setCookie: (name: string, value: string) => void;
    userIdentifierSelector?: UserIdentifierSelector<T>;
    extraPayload?: Record<string, any>;
};
