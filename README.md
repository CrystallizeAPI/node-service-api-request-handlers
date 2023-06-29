# Node Service API Request Handlers

This is a Node library that enables plug and play routing for your Service API when it is using the **Node Service API Router**.

It provides schemas and handlers that take care of 90% of the work while being highly customizable and totally agnostic of any frameworks.

## Installation

With NPM:

```bash
npm install @crystallize/node-service-api-request-handlers
```

With Yarn:

```bash
yarn add @crystallize/node-service-api-request-handlers
```

## Agnostic Handlers

The schemas and handlers can be used with any framework and without Node Service API Router.

A handler signature is always the same:

```typescript
const handler = async (payload: Payload, args: Arguments): Promise<Something>
```

Using Node Service API Router, there is a simple integration:

```typescript
const bodyConvertedRoutes: ValidatingRequestRouting = {
    '/endpoint': {
        post: {
            schema: Payload,
            handler: handler,
            args: (context: Koa.Context): Arguments => {
                return {};
            },
        },
    },
};
```

Outside of the Node Service API Router:

```typescript
await handler(validatePayload<Payload>(body, payloadSchema), {});
```

Note: As you see, in this context, it’s your responsibility to validate the body with the schema (see a full example below, with Cart Management).

## Cart Management

The JS API Client already helps you to hydrate products from SKUs or Paths. This handler performs the next step: [it hydrates the products and more](https://github.com/CrystallizeAPI/libraries/blob/main/components/node-service-api-request-handlers/src/cart/handlers.ts#L6).

First and as usual, it lets you extend the GraphQL hydration query. Second, it does the price calculation for you.

To use it:

```typescript
const bodyConvertedRoutes: ValidatingRequestRouting = {
    '/cart': {
        post: {
            schema: cartPayload,
            handler: handleCartRequestPayload,
            args: (context: Koa.Context): CartHydraterArguments => {
                return {
                    perVariant: () => {
                        return {
                            id: true,
                        };
                    },
                };
            },
        },
    },
};
```

That’s it! The heavy lifting is done for you!

If you are using the Handler without Node Service API Router, for example with Remix Run:

```typescript
export const action: ActionFunction = async ({ request }) => {
    const body = await request.json();
    await handleCartRequestPayload(validatePayload<CartPayload>(body, cartPayload), {
        currency,
        perVariant: () => {
            return {
                firstImage: {
                    url: true,
                },
            };
        },
});
```

### Available Arguments

-   currency (required): the Hydrater MUST know the currency to pick a valid PriceVariant
-   hydraterBySkus (optional): your own Hydrater
-   extraQuery (optional): if you want more information in the response
-   perProduct (optional): if you want more information in the response per product hydrated
-   perVariant (optional): if you want more information in the response per variant hydrated
-   pricesHaveTaxesIncludedInCrystallize (optional): informs the handler if the prices in Crystallize include taxes or not to adapt the calculations. (default is FALSE)
-   selectPriceVariant (optional): if you want to pick the PriceVariant (default is the first PriceVariant)
-   basePriceVariant (optional): if you want to pick the PriceVariant used to calculated strike price (Discount) (default is selectPriceVariant)

## Magick Link Authentication

It comes with 2 handlers:

-   handleMagickLinkRegisterPayload
-   handleMagickLinkConfirmationRequestPayload

You can use them in the following way.

Handling the registration / request for a link:

```typescript
'/register/email/magicklink': {
    post: {
        schema: magickLinkUserInfosPayload,
        handler: handleMagickLinkRegisterPayload,
        args: (context: Koa.Context): MagickLinkRegisterArguments => {
            return {
                mailer: createMailer(`${process.env.MAILER_DSN}`),
                jwtSecret: `${process.env.JWT_SECRET}`,
                confirmLinkUrl: `http${context.secure ? 's' : ''}://${context.request.host}/confirm/email/magicklink/:token`,
                subject: "[Crystallize - Boilerplate] - Magic link login",
                from: "hello@crystallize.com",
                buildHtml: (request: MagickLinkUserInfosPayload, link: string) => mjml2html(
                    `<mjml>
                    <mj-body>
                    <mj-section>
                        <mj-column>
                        <mj-text>Hi there ${request.email}! Simply follow the link below to login.</mj-text>
                        <mj-button href="${link}" align="left">Click here to login</mj-button>
                        </mj-column>
                    </mj-section>
                    </mj-body>
                </mjml>`
                ).html,
                host: context.request.host
            }
        }
    }
},
```

As you can see, the _MagickLinkRegisterArguments_ type lets you inject many things:

-   a `mailer` to send the link as well as all the email information: subject, from, and the HTML

-   the `jwtSecret` to generate and sign the JTW token

the link to confirm the Magick link: `confirmLinkPath`

You have control over everything while the handler does the heavy lifting.

Then you can leverage the other handler associated with it:

```typescript
"/confirm/email/magicklink/:token": {
    get: {
        schema: null,
        handler: handleMagickLinkConfirmationRequestPayload,
        args: (context: Koa.Context): MagickLinkConfirmArguments => {
            return {
                token: context.params.token,
                host: context.request.host,
                jwtSecret: `${process.env.JWT_SECRET}`,
                backLinkPath: 'https://frontend.app.crystal/checkout?token=:token',
                setCookie: (name: string, value: string) => {
                    context.cookies.set(name, value, { httpOnly: false, secure: context.secure });
                }
            }
        }
    },
},
```

Of course, it matches the _confirmLinkPath_ passed in the first handler. It is also interesting to note that there is no Schema because there is no body for those requests.

You also need to pass:

-   the `jwtSecret` to decode and verify the token
-   provide a link `backLinkPath` to inform the handler where to redirect the user (most likely to your frontend)

Once the token is checked and valid, the handler will generate 2 other tokens:

-   a first JWT token that will be saved in the Cookie. This token can then be used to authenticate requests on your service API.
-   a second JWT token that will be passed to the `backLinkPath`. This token SHOULD NOT be used for authentication, but it is actually a nice format (JWT) to transport non-sensitive information to your frontend.

## Orders

These 2 handlers are very simple ones that will check that one or more Orders actually match the authenticated user after it has fetched the Order(s):

```typescript
"/orders": {
    get: {
        schema: null,
        authenticated: true,
        handler: handleOrdersRequestPayload,
        args: (context: Koa.Context): OrdersArguments => {
            return {
                user: context.user
            }
        }
    }
},
"/order/:id": {
    get: {
        schema: null,
        authenticated: true,
        handler: handleOrderRequestPayload,
        args: (context: Koa.Context): OrderArguments => {
            return {
                user: context.user,
                orderId: context.params.id
            };
        }
    }
},
```

This is a useful endpoint to display the Order(s) to the customer and enforce that this customer is logged in.

## Stripe Payment

There are 2 handlers to handle payment with Stripe.

The first handler is to manage the creation of the Stripe Payment Intent:

```typescript
const body = await request.json();
const data = await handleStripeCreatePaymentIntentRequestPayload(validatePayload(body, stripePaymentIntentPayload), {
    secret_key: process.env.STRIPE_SECRET_KEY,
    fetchCart: async () => {
        const cartId = body.cartId as string;
        const cartWrapper = await cartWrapperRepository.find(cartId);
        if (!cartWrapper) {
            throw {
                message: `Cart '${cartId}' does not exist.`,
                status: 404,
            };
        }
        return cartWrapper.cart;
    },
    createIntentArguments: (cart: Cart) => {
        return {
            amount: cart.total.net * 100,
            currency: cart.total.currency,
        };
    },
});
```

Arguments are:

-   secret_key (required): to communicate with Stripe
-   fetchCart (required): provide the hander a way to fetch the Cart
-   createIntentArguments (required): using the Cart as input, return the parameters to put in the Stripe Intent

The second handler is to handle the Webhook that Stripe will call to inform about the Payment Intent:

```typescript
const body = await request.json();
const data = await handleStripePaymentIntentWebhookRequestPayload(body, {
    secret_key: process.env.STRIPE_SECRET_KEY,
    endpointSecret: process.env.STRIPE_SECRET_PAYMENT_INTENT_WEBHOOK_ENDPOINT_SECRET,
    signature: request.headers.get('stripe-signature') as string,
    rawBody: body,
    handleEvent: async (eventName: string, event: any) => {
        const cartId = event.data.object.metadata.cartId;
        switch (eventName) {
            case 'payment_intent.succeeded':
                const cartWrapper = await cartWrapperRepository.find(cartId);
                if (!cartWrapper) {
                    throw {
                        message: `Cart '${cartId}' does not exist.`,
                        status: 404,
                    };
                }
            // your own logic
        }
    },
});
```

Arguments are:

-   secret_key (required): to communicate with Stripe
-   endpointSecret (required): to verify the Signature from Stripe
-   signature (required): receive in the Request to enforce validation that is coming from Stripe
-   rawBody (required): needed to validate the Request Signature
-   handleEvent (required): your custom logic

## QuickPay Payment

There are 2 handlers to handle payment with QuickPay.

The first handler is to manage the creation of the Quick Payment and the Link:

```typescript
const body = await httpRequest.json();
const data = await handleQuickPayCreatePaymentLinkRequestPayload(
    validatePayload(body, quickPayCreatePaymentLinkPayload),
    {
        api_key: process.env.QUICKPAY_API_KEY,
        fetchCart: async () => {
            const cartId = body.cartId as string;
            const cartWrapper = await cartWrapperRepository.find(cartId);
            if (!cartWrapper) {
                throw {
                    message: `Cart '${cartId}' does not exist.`,
                    status: 404,
                };
            }
            return cartWrapper.cart;
        },
        createPaymentArguments: (cart: Cart) => {
            const cartId = body.cartId as string;
            return {
                amount: cart.total.net * 100, // in cents
                currency: cart.total.currency,
                urls: {
                    continue: `${baseUrl}/order/cart/${cartId}`,
                    cancel: `${baseUrl}/order/cart/${cartId}`,
                    callback: `${baseUrl}/api/webhook/payment/quickpay`,
                },
            };
        },
    },
);
```

Arguments are:

-   api_key (required): to communicate with QuickPay
-   fetchCart (required): provide the hander a way to fetch the Cart
-   createPaymentArguments (required): using the Cart as input, return the parameters to put in the QuickPay Payment. This is also where you will pass the Return URLs.

The second handler is to handle the Webhook that QuickPay will call to inform about the Payment:

```typescript
const body = await httpRequest.json();
const data = await handleQuickPayPaymentUpdateWebhookRequestPayload(body, {
    private_key: process.env.QUICKPAY_PRIVATE_KEY,
    signature: httpRequest.headers.get('Quickpay-Checksum-Sha256') as string,
    rawBody: body,
    handleEvent: async (event: any) => {
        const cartId = event.variables.cartId;
        switch (event.type?.toLowerCase()) {
            case 'payment':
                const cartWrapper = await cartWrapperRepository.find(cartId);
                if (!cartWrapper) {
                    throw {
                        message: `Cart '${cartId}' does not exist.`,
                        status: 404,
                    };
                }
            // your own logic
        }
    },
});
```

Arguments are:

-   private_key (required): to verify the Signature from QuickPay
-   signature (required): receive in the Request to enforce validation that is coming from QuickPay
-   rawBody (required): needed to validate the Request Signature
-   handleEvent (required): your custom logic

## Montonio Payment

There are 2 handlers to handle payment with Montonio.

The first handler is to manage the creation of the Link:

```typescript
await handleMontonioCreatePaymentLinkRequestPayload(validatePayload(payload, montonioCreatePaymentLinkPayload), {
    origin: process.env.MONTONIO_ORIGIN,
    access_key: process.env.MONTONIO_ACCESS_KEY,
    secret_key: process.env.MONTONIO_SECRET_KEY,
    fetchCart: async () => {
        return cartWrapper.cart;
    },
    createPaymentArguments: (cart: Cart) => {
        const orderCartLink = buildLanguageMarketAwareLink(
            `/order/cart/${cartWrapper.cartId}`,
            context.language,
            context.market,
        );
        return {
            amount: cart.total.gross,
            currency: cart.total.currency,
            urls: {
                return: `${context.baseUrl}${orderCartLink}`,
                notification: `${context.baseUrl}/api/webhook/payment/montonio`,
            },
            customer: {
                email: cartWrapper.customer.email,
                firstName: cartWrapper.customer.firstName,
                lastName: cartWrapper.customer.lastName,
            },
        };
    },
});
```

Arguments are:

-   origin(required): to tell the SDK if that’s toward the sandbox or any other Montonio endpoint.
-   access_key(required): to identify the call to Montonio
-   secret_key(required): to sign the JWT
-   fetchCart (required): provide the hander a way to fetch the Cart
-   createPaymentArguments (required): using the Cart as input, return the parameters to put in the Montonio Payment. This is also where you will pass the Return URLs.

The second handler is to handle the Webhook that Montonio will call to inform about the Payment:

```typescript
await handleMontonioPaymentUpdateWebhookRequestPayload(
    {},
    {
        secret_key: process.env.MONTONIO_SECRET_KEY,
        token,
        handleEvent: async (event: any) => {
            const cartId = event.merchant_reference;
            switch (event.status) {
                case 'finalized':
                    const cartWrapper = await cartWrapperRepository.find(cartId);
                    if (!cartWrapper) {
                        throw {
                            message: `Cart '${cartId}' does not exist.`,
                            status: 404,
                        };
                    }
                // your own logic
            }
        },
    },
);
```

Arguments are:

-   secret_key (required): to verify the Signature from Montonio
-   token (required): the token provided by Montonio
-   handleEvent (required): your custom logic

## Adyen Payment

There are 2 handlers to handle payment with Adyen.

The first handler is to manage the creation of the session:

```typescript
await handleAdyenPaymentSessionPayload(validatePayload(payload, adyenPaymentPayload), {
    currency,
    returnUrl: `${context.baseUrl}${orderCartLink}`,
    merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
    apiKey: process.env.ADYEN_API_KEY,
    env: process.env.ADYEN_ENV,
    countryCode: currency === 'NOK' ? 'NO' : currency === 'USD' ? 'US' : 'FR',
    fetchCart: async () => {
        return cartWrapper.cart;
    },
});
```

Arguments are:

-   currency (required): the currency the payment will take place in
-   merchantAccount (required): your Adyen merchant account name
-   apiKey (required): to communicate with Adyen
-   env (required): the Adyen environment, can either be 'Live' or 'TEST'
-   countrCode (required): the ISO country code where the transaction is taking place
-   fetchCart (required): provide the hander a way to fetch the Cart

The second handler is to handle the Webhook that Adyen will call to inform about the Payment:

```typescript
await handleAdyenWebhookRequestPayload(payload, {
    handleEvent: async () => {
        for (let i = 0; i < payload?.notificationItems?.length; i++) {
            const event = payload?.notificationItems[i]?.NotificationRequestItem;
            const cartId = event.merchantReference;

            switch (event.eventCode) {
                case 'AUTHORISATION':
                    const cartWrapper = await cartWrapperRepository.find(cartId);
                    if (event.success !== 'true') {
                        throw {
                            message: `Payment failed for cart '${cartId}'.`,
                            status: 403,
                        };
                    }
                    if (!cartWrapper) {
                        throw {
                            message: `===> Cart '${cartId}' does not exist.`,
                            status: 404,
                        };
                    }
                // your custom logic here
            }
        }
    },
});
```

Argument is:

-   handleEvent (required): your custom logic

## Razorpay Payment

There are 2 handlers to handle payment with Razorpay.

The first handler is to manage the creation of the order:

```typescript
await handleRazorPayOrderPayload(validatePayload(payload, razorPayPaymentPayload), {
    currency: cartWrapper.cart.total.currency.toUpperCase(),
    credentials: {
        key_id: process.env.RAZORPAY_ID,
        key_secret: process.env.RAZORPAY_SECRET,
    },
    fetchCart: async () => {
        return cartWrapper.cart;
    },
});
```

Arguments are:

-   currency (required): the currency the payment will take place in
-   credentials: includes both the key_id and the key_secret to communicate with Razorpay
-   fetchCart (required): provide the hander a way to fetch the Cart

The second handler is to verify the transaction:

```typescript
await handleRazorPayPaymentVerificationPayload(payload, {
    orderCreationId: payload.orderCreationId,
    razorpayPaymentId: payload.razorpayPaymentId,
    razorpayOrderId: payload.razorpayOrderId,
    razorpaySignature: payload.razorpaySignature,
    key_secret: process.env.RAZORPAY_SECRET,
    key_id: process.env.RAZORPAY_ID,
    handleEvent: async (eventName: string, event: any) => {
        const cartId = event.notes.cartId;
        const cartWrapper = await cartWrapperRepository.find(cartId);
        if (!cartWrapper) {
            throw {
                message: `Cart '${cartId}' does not exist.`,
                status: 404,
            };
        }
        switch (eventName) {
            case 'success':
            // your custom logic here
        }
    },
});
```

Arguments are:

-   orderCreationId (required): the order creation ID sent by Razorpay in the previous step
-   razorpayPaymentId (required): the payment ID receieved in the last step
-   razorparOrderId (required): different from the order creation ID, recieved when the order is created in Razorpay
-   razorpaySignature (required): receive in the Request to enforce validation that is coming from Razorpay
-   key_secret (required): to communicate with Razorpay
-   key_id (required): API key ID to communicate with Razorpay
-   handleEvent (required): your custom logic

## Vipps Payment

This libs provide many handlers to handle payment and login with Vipps and some functions to ease the integration.

> Vipps does not have Webhooks mechanism yet, so polling must be used.

The first handler is to manage the creation of a Checkout Session:

```typescript
const handlingResult = await handleVippsCreateCheckoutSessionRequestPayload(
    validatePayload(payload, vippsInitiatePaymentPayload),
    {
        origin: process.env.VIPPS_ORIGIN,
        clientId: process.env.VIPPS_CLIENT_ID,
        clientSecret: process.env.VIPPS_CLIENT_SECRET,
        merchantSerialNumber: process.env.VIPPS_MSN,
        subscriptionKey: process.env.VIPPS_SUBSCRIPTION_KEY,
        fetchCart: async () => {
            return cartWrapper.cart;
        },
        createCheckoutArguments: (cart: Cart) => {
            return {
                amount: cart.total.gross * 100,
                currency: 'NOK',
                callbackUrl,
                returnUrl,
                callbackAuthorizationToken,
                paymentDescription: `Payment for Cart XXX`,
            };
        },
    },
);
```

Arguments are:

-   all the env variables that act as credentials to discuss with Vipps, this library handles the heavy lifting.
-   fetchCart (required): provide the hander a way to fetch the Cart
-   createCheckoutArguments(required): is the way to customize your Vipps Checkout experience

The second handler is really similar, to handle a flow using the Vipps Payment API, you have more control here.

```typescript
const handlingResult = await handleVippsInitiatePaymentRequestPayload(
    validatePayload(payload, vippsInitiatePaymentPayload),
    {
        ...sameAsTheOther,
        createIntentArguments: (cart: Cart) => {
            return {
                amount: cart.total.gross * 100,
                currency: 'NOK',
                paymentMethod: vippsMethod as 'CARD' | 'WALLET',
                userFlow: vippsFlow as 'PUSH_MESSAGE' | 'NATIVE_REDIRECT' | 'WEB_REDIRECT' | 'QR',
                returnUrl,
            };
        },
    },
);
```

Almost the same arguments but with the other function:

-   createIntentArguments(required): is the way to customize your Vipps ePayment flow experience.

The third handler is to verify the transaction:

Once again Vipps does not have Webhooks so this is just a passthrough that you can call directly for now.

```typescript
await handleVippsPayPaymentUpdateWebhookRequestPayload(payload, {
    handleEvent: async (payment: any) => {
        if (payment.state === 'AUTHORIZED') {
            const orderCreatedConfirmation = await pushOrder(cartWrapperRepository, apiClient, cartWrapper, {...});
            const credentials: VippsAppCredentials = {...};
            const receipt: VippsReceipt = {...}
            };
            addVippsReceiptOrder({
                paymentType: "ecom",
                orderId: cartWrapper.cartId,
                receipt,
            }, credentials)
            return orderCreatedConfirmation;
        }
    },
```

Arguments are:

-   handleEvent (required): your custom logic

This is interesting to see the usage of the function `addVippsReceiptOrder` which is an helper to push a `VippsReceipt` with the Order on Vipps side.

The last bit of the Vipps integration is the Polling mechanism, you can use any system to run that code every 2-5 seconds and this library provides you 2 methods to check the payment status:

```typescript
fetchVippsCheckoutSession = (url: string, credentials: VippsAppCredentials) => Promise<{ session: any, payment?: any}>

fetchVippsPayment = (reference: string, credentials: VippsAppCredentials) => Promise<any|undefined>
```

`fetchVippsCheckoutSession` is actually using `fetchVippsPayment` when the Session has a payment associated with it. (during the flow).

The final usage could look similar to this:

```typescript
const handlingResult = {.../* See below */}
if (handlingResult) {
    pollingUntil(async () => {
        if (handlingResult.pollingUrl) {
            const { payment, session } = await fetchVippsCheckoutSession(handlingResult.pollingUrl, credentials);
            if (!payment) {
                return false;
            }
            await handleVippsPayPaymentUpdateWebhookRequestPayload(...)
            return session.paymentDetails?.state !== 'CREATED';
        }

        const payment = await fetchVippsPayment(handlingResult.reference, credentials);
        if (!payment) {
            return false;
        }
        await handleVippsPayPaymentUpdateWebhookRequestPayload(...)
        return payment.state !== 'CREATED';
    });
}
```

The `pollingUntil` function is a simple function that run `setTimeout`.
If the payment state is different than `CREATED` we stop polling.

The fourth handler is to manage the Express Checkout, the logic is similar

```typescript
await handleVippsInitiateExpressCheckoutRequestPayload({ cartId: cartWrapper.cartId },
    {
        ...,
        callbackPrefix: `${context.baseUrl}${webhookCallbackUrl}`,
        consentRemovalPrefix: `${context.baseUrl}${buildLanguageMarketAwareLink('/', context.language, context.market)}`,
        fallback: `${context.baseUrl}${orderCartUrl}`,
        extraMerchantInfo: {...}
    },
);
```

Then you can continue the flow like the previous method.

The fifth handler is to handle the login and it behaves the same way as the magick link feature described above, but instead of receiving a JWT from an link in an email it receives a `code` and a `state` from Vipps.

```typescript
await handleVippsLoginOAuthRequestPayload(
    {
        context.url.searchParams.get('code'),
        state: context.url.searchParams.get('state'),
    },
    {
        ...credentials,
        host: context.host,
        expectedState,
        redirectUri,
        jwtSecret,
        backLinkPath: `${frontendUrl}${backLinkPath}?token=:token`,
        setCookie: (name: string, value: string) => {
            {...}
        },
        onUserInfos: async (userInfos) => {
            {...}
        },
    },
);
```

> Under the hood, the handler verifies the Code with Vipps and it fetches the UserInfos.
> Then the handler behave the same as the Magick Link handler, and you have the `onUserInfos` hook that you can use to do more with data coming from Vipps.

[crystallizeobject]: crystallize_marketing|folder|62561a2ab30ff82a1f664932
