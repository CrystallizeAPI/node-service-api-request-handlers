import { fetchDinteroAuthToken } from './fetchAuthToken';
import { DinteroCreateSessionArguments, DinteroPaymentPayload, DinteroPaymentVerificationArguments } from './types';

const buildAddress = (customer: any) => {
    return {
        first_name: customer.firstName ?? '',
        last_name: customer.lastName ?? '',
        address_line: customer?.streetAddress ?? '',
        postal_code: customer?.zipCode ?? '',
        postal_place: customer?.city ?? '',
        country: customer?.country ?? '',
        email: customer?.email ?? '',
    };
};

export async function handleDinteroPaymentSessionPayload(
    payload: DinteroPaymentPayload,
    args: DinteroCreateSessionArguments,
): Promise<{ sessionId: string; data: any }> {
    const cart = await args.fetchCart();

    const authToken = await fetchDinteroAuthToken(args.credentials);

    const response = await fetch('https://checkout.dintero.com/v1/sessions-profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken.access_token}`,
        },
        body: JSON.stringify({
            profile_id: args.credentials.profileId ?? 'default',
            order: {
                currency: cart.total.currency,
                merchant_reference: payload.cartId,
                amount: cart.total.gross * 100,
                vat_amount: cart.total.taxAmount * 100,
                items: cart.cart.items.map((item, index) => ({
                    id: item.variant.sku,
                    line_id: index.toString(),
                    description: item.variant.name,
                    quantity: item.quantity,
                    vat_amount: item.price.taxAmount * 100,
                    amount: item.price.gross * 100,
                    thumbnail_url: item.variant.firstImage?.url ?? '',
                    discounts:
                        item.price?.discounts?.map((discount) => ({
                            percent: discount.percent,
                            amount: discount.amount * 100,
                        })) ?? [],
                })),
                shipping_address: buildAddress(args.customer),
                billing_address: buildAddress(args.customer),
            },
            url: {
                return_url: args.returnUrl,
                callback_url: args.callbackUrl,
            },
            customer: {
                email: args?.customer?.email ?? '',
            },
        }),
    }).then((res) => res.json());

    if (!response) {
        throw new Error('Session not created');
    }

    return {
        sessionId: response.id,
        data: response,
    };
}

export async function handleDinteroVerificationPayload(
    payload: DinteroPaymentVerificationArguments,
    args: DinteroPaymentVerificationArguments,
): Promise<any> {
    const authToken = await fetchDinteroAuthToken(args.credentials);

    const response = await fetch(`https://checkout.dintero.com/v1/transactions/${args.transactionId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken.access_token}`,
        },
    }).then((res) => res.json());

    if (!response) {
        throw new Error('Could not fetch Dintero transaction');
    }

    return args.handleEvent(response.status, response);
}
