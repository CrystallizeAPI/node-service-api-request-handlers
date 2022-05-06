import {
    CrystallizeOrderFetcherById,
    CrystallizeOrderFetcherByCustomerIdentifier,
    Order,
} from '@crystallize/js-api-client';
import { OrderArguments, OrdersArguments } from './types';

export async function handleOrderRequestPayload(payload: any, args: OrderArguments): Promise<Order> {
    const order = await CrystallizeOrderFetcherById(
        args.orderId,
        args?.onCustomer,
        args?.onOrderItem,
        args?.extraQuery,
    );
    if (order.customer?.identifier !== args.user) {
        throw {
            status: 403,
            message: 'Unauthorized. That is not your order.',
        };
    }
    return order;
}

export async function handleOrdersRequestPayload(payload: any, args: OrdersArguments): Promise<Order[]> {
    // @todo: handle pagination
    const pagination = await CrystallizeOrderFetcherByCustomerIdentifier(
        args.user,
        args?.extraQueryArgs,
        args?.onCustomer,
        args?.onOrderItem,
        args?.extraQuery,
    );
    return pagination.orders;
}
