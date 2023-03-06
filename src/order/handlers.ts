import {
    CrystallizeOrderFetcherById,
    CrystallizeOrderFetcherByCustomerIdentifier,
    Order,
} from '@crystallize/js-api-client';
import { OrderArguments, OrdersArguments } from './types';

export async function handleOrderRequestPayload(payload: any, args: OrderArguments): Promise<Order> {
    const fetcher = args.fetcherById ?? CrystallizeOrderFetcherById;
    const order = await fetcher(args.orderId, args?.onCustomer, args?.onOrderItem, args?.extraQuery);
    if (!order) {
        throw {
            status: 404,
            message: `Order ${args.orderId} does not exist.`,
        };
    }
    if (args.checkIfOrderBelongsToUser && args.checkIfOrderBelongsToUser() === false) {
        return order;
    }
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
    const fetcher = args.fetcherByCustomerIdentifier ?? CrystallizeOrderFetcherByCustomerIdentifier;
    const pagination = await fetcher(
        args.user,
        args?.extraQueryArgs,
        args?.onCustomer,
        args?.onOrderItem,
        args?.extraQuery,
    );
    return pagination.orders;
}
