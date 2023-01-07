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

The first handler is to manage the creation of the the Link:

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

[crystallizeobject]: crystallize_marketing|folder|62561a2ab30ff82a1f664932
