import { CrystallizeOrderFetcherByCustomerIdentifier, CrystallizeOrderFetcherById } from '@crystallize/js-api-client';

export type OrderArguments = {
    fetcherById?: typeof CrystallizeOrderFetcherById;
    orderId: string;
    user: string;
    onCustomer?: any;
    onOrderItem?: any;
    extraQuery?: any;
    checkIfOrderBelongsToUser?: () => boolean;
};

export type OrdersArguments = {
    fetcherByCustomerIdentifier?: typeof CrystallizeOrderFetcherByCustomerIdentifier;
    user: string;
    extraQueryArgs?: any;
    onCustomer?: any;
    onOrderItem?: any;
    extraQuery?: any;
};
