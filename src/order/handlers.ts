import Koa from 'koa';
import {
    CrystallizeOrderFetcherById,
    CrystallizeOrderFetcherByCustomerIdentifier,
    Order
} from '@crystallize/js-api-client';
import { OrderArguments, OrdersArguments } from './types';

export async function handleOrderRequest(request: any, context: Koa.Context, args: OrderArguments): Promise<Order> {
    const order = await CrystallizeOrderFetcherById(
        context.params.id,
        args?.onCustomer,
        args?.onOrderItem,
        args?.extraQuery
    );
    if (order.customer?.identifier !== context.user) {
        throw {
            status: 403,
            message: 'Unauthorized. That is not your order.'
        };
    }
    return order;
}

export async function handleOrdersRequest(request: any, context: Koa.Context, args: OrdersArguments): Promise<Order[]> {
    // @todo: handle pagination
    const pagination = await CrystallizeOrderFetcherByCustomerIdentifier(
        context.user,
        args?.extraQueryArgs,
        args?.onCustomer,
        args?.onOrderItem,
        args?.extraQuery
    );
    return pagination.orders;
}
