import Razorpay from 'razorpay';
import crypto from 'crypto';
import {
    RazorPayCreateOrderArguments,
    RazorPayPaymentPayload,
    RazorPayPaymentVerificationArguments,
    RazorPayVerificationPayload,
} from './types';

export async function handleRazorPayOrderPayload(
    payload: RazorPayPaymentPayload,
    args: RazorPayCreateOrderArguments,
): Promise<{ orderID: string; data: any }> {
    const cart = await args.fetchCart();

    const instance = new Razorpay({
        key_id: args.credentials.key_id,
        key_secret: args.credentials.key_secret,
    });

    const options = {
        amount: cart.total.gross * 100, // amount in the smallest currency unit
        currency: args.currency,
        receipt: crypto.createHash('md5').update(payload.cartId).digest('hex').substring(0, 20),
        notes: {
            cartId: payload.cartId,
        },
    };

    const order = await instance.orders.create(options);

    if (!order) {
        throw new Error('Order not created');
    }

    return {
        orderID: order.id,
        data: order,
    };
}

export async function handleRazorPayPaymentVerificationPayload(
    payload: RazorPayVerificationPayload,
    args: RazorPayPaymentVerificationArguments,
): Promise<any> {
    const instance = new Razorpay({
        key_id: args.key_id,
        key_secret: args.key_secret,
    });
    const checksum = args.razorpaySignature;
    const bodyHashed = crypto
        .createHmac('sha256', args.key_secret)
        .update(`${args.orderCreationId}|${args.razorpayPaymentId}`)
        .digest('hex');

    if (checksum !== bodyHashed) {
        console.error('Signature is not valid');
        return {};
    }

    const fetchRazorpayOrder = await instance.orders.fetch(args.razorpayOrderId);

    return await args.handleEvent('success', fetchRazorpayOrder);
}
