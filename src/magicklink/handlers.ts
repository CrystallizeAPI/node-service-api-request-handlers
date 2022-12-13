import jwt from 'jsonwebtoken';
import { MagickLinkConfirmArguments, MagickLinkRegisterArguments, MagickLinkUserInfosPayload } from './types';

export async function handleMagickLinkRegisterPayload<
    T extends MagickLinkUserInfosPayload = MagickLinkUserInfosPayload,
>(payload: T, args: MagickLinkRegisterArguments<T>): Promise<T> {
    const selector = args.userIdentifierSelector ?? ((payload: T) => payload.email);
    // we use a symetric key here to make it simple, but in production you should use a public/private key pair
    // which will allow you to verify the token client side too, (even if not really required it is a good idea)
    const magickToken = jwt.sign(payload, args.jwtSecret, {
        expiresIn: '30m',
        audience: selector(payload),
        subject: 'magicklink',
        issuer: args.host,
    });
    const link = args.confirmLinkUrl.replace(':token', magickToken);
    args.mailer(args.subject, payload.email, args.from, args.buildHtml(payload, link));
    return payload;
}

export async function handleMagickLinkConfirmationRequestPayload<
    T extends MagickLinkUserInfosPayload = MagickLinkUserInfosPayload,
>(payload: any, args: MagickLinkConfirmArguments<T>): Promise<string> {
    const selector = args.userIdentifierSelector ?? ((payload: T) => payload.email);

    const magickToken: string = (args.token || '') as string;
    const magickTokenDecoded = jwt.verify(magickToken, args.jwtSecret) as T;

    const jwtPayload = {
        email: magickTokenDecoded.email,
        firstname: magickTokenDecoded.firstname,
        lastname: magickTokenDecoded.lastname,
        ...(args.extraPayload ? args.extraPayload : {}),
    };

    // now we create 2 tokens, one for the frontend to indicate that we are logged in and one for the service api in the Cookie
    // the token for the frontend is NOT a prood of login
    const isSupposedToBeLoggedInOnServiceApiToken = jwt.sign(jwtPayload, args.jwtSecret, {
        expiresIn: '1d',
        audience: selector(magickTokenDecoded),
        subject: 'isSupposedToBeLoggedInOnServiceApi',
        issuer: args.host,
    });

    const isLoggedInOnServiceApiToken = jwt.sign(jwtPayload, args.jwtSecret, {
        expiresIn: '1d',
        audience: selector(magickTokenDecoded),
        subject: 'isLoggedInOnServiceApiToken',
        issuer: args.host,
    });
    args.setCookie('jwt', isLoggedInOnServiceApiToken);
    return args.backLinkPath.replace(':token', isSupposedToBeLoggedInOnServiceApiToken);
}
