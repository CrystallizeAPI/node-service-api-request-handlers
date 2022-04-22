export type OrderArguments = {
    orderId: string;
    user: string;
    onCustomer?: any;
    onOrderItem?: any;
    extraQuery?: any;
};

export type OrdersArguments = {
    user: string;
    extraQueryArgs?: any;
    onCustomer?: any;
    onOrderItem?: any;
    extraQuery?: any;
};
