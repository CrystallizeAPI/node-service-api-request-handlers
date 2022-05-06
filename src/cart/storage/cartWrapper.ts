import { createStateMachine, StateMachine, StateMachineDefinition } from '../../core/statemachine';
import { BackendStorage } from '../../core/type';
import { Cart } from '../types';

export enum State {
    Cart = 'cart',
    Placed = 'placed',
    Paid = 'paid',
}

export enum Transition {
    Save = 'save',
    Place = 'place',
    Fullfill = 'fullfill',
}

export type CartWrapper = {
    customer?: any;
    cart: Cart;
    cartId: string;
    state: State;
    extra: any;
};

export type CartWrapperRepository = {
    find: (id: string) => Promise<CartWrapper | undefined | null>;
    create: (cart: Cart, id: string, extra?: any) => CartWrapper;
    save: (cartWrapper: CartWrapper) => boolean;
    place: (cartWrapper: CartWrapper) => boolean;
    attachOrderId: (cartWrapper: CartWrapper, orderId: string) => void;
};

const defaultStateMachineDefinition: StateMachineDefinition = {
    states: {
        [State.Cart]: {
            transitions: {
                [Transition.Save]: {
                    to: State.Cart,
                },
                [Transition.Place]: {
                    to: State.Placed,
                },
            },
        },
        [State.Placed]: {
            transitions: {
                [Transition.Fullfill]: {
                    to: State.Paid,
                },
            },
        },
        [State.Paid]: {
            transitions: {},
        },
    },
};

export function createRepository(
    storage: BackendStorage,
    stateMachineDefinition?: StateMachineDefinition,
): CartWrapperRepository {
    const buildMachine = (subject: any): StateMachine =>
        createStateMachine(subject, 'state', stateMachineDefinition || defaultStateMachineDefinition);

    async function find(id: string): Promise<CartWrapper | null> {
        let item = await storage.get(id);
        if (item) {
            return JSON.parse(item);
        }
        return null;
    }

    async function persist(item: CartWrapper): Promise<void> {
        await storage.set(item.cartId, JSON.stringify(item));
    }

    function create(cart: Cart, id: string, extra?: any): CartWrapper {
        return {
            cartId: id,
            cart,
            state: State.Cart,
            extra,
        };
    }

    function save(cartWrapper: CartWrapper): boolean {
        const machine = buildMachine(cartWrapper);
        const transition = Transition.Save;
        if (!machine.canTransit(transition)) {
            return false;
        }

        machine.transition(transition);
        persist(cartWrapper);
        return true;
    }

    function place(cartWrapper: CartWrapper): boolean {
        const machine = buildMachine(cartWrapper);
        const transition = Transition.Place;
        if (!machine.canTransit(transition)) {
            return false;
        }

        machine.transition(transition);
        persist(cartWrapper);
        return true;
    }

    function attachOrderId(cartWrapper: CartWrapper, orderId: string): void {
        cartWrapper.extra = { ...cartWrapper.extra, orderId };
        const machine = buildMachine(cartWrapper);
        machine.transition(Transition.Fullfill);
        persist(cartWrapper);
    }

    return {
        find,
        create,
        save,
        place,
        attachOrderId,
    };
}
