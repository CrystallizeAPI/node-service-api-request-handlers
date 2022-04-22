import { z } from 'zod';

export const magickLinkUserInfosPayload = z
    .object({
        email: z.string(),
        firstname: z.string(),
        lastname: z.string()
    })
    .strict();

export type MagickLinkUserInfosPayload = z.infer<typeof magickLinkUserInfosPayload>;
export type MagickLinkUserInfos = MagickLinkUserInfosPayload;

export type MagickLinkRegisterArguments = {
    host: string;
    mailer: (subject: string, to: string[] | string, from: string, html: string) => void;
    jwtSecret: string;
    confirmLinkUrl: string;
    subject: string;
    from: string;
    buildHtml: (request: MagickLinkUserInfos, link: string) => string;
};

export type MagickLinkConfirmArguments = {
    jwtSecret: string;
    backLinkPath: string;
    token: string;
    host: string;
    setCookie: (name: string, value: string) => void;
};
