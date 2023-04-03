import { z } from 'zod';
import type { Image, Product, ProductVariant, ProductPriceVariant, ProductHydrater } from '@crystallize/js-api-client';

const cartItemPayload = z.object({
    sku: z.string(),
    quantity: z.number(),
});

export const cartPayload = z.object({
    locale: z.string(),
    withImages: z.boolean().optional(),
    items: z.array(cartItemPayload),
});

export type CartPayload = z.infer<typeof cartPayload>;
export type CartItemPayload = z.infer<typeof cartItemPayload>;

export interface KeyValuePair {
    key: string;
    value?: string;
}

export interface Cart {
    cart: {
        items: CartItem[];
    };
    total: Price;
}

export interface CartItem {
    quantity: number;
    price: Price;
    images?: Image[];
    product: Product;
    variant: ProductVariant;
    variantPrice: ProductPriceVariant;
    meta?: KeyValuePair[];
}

export interface Price {
    gross: number;
    net: number;
    currency: string;
    taxAmount: number;
    discounts?: {
        amount: number;
        percent?: number;
    }[];
}

export type CartHydraterArguments = {
    hydraterBySkus?: ProductHydrater;
    extraQuery?: any;
    perProduct?: (item: string, index: number) => any;
    perVariant?: (item: string, index: number) => any;
    currency: string;
    pricesHaveTaxesIncludedInCrystallize?: boolean;
    // the PriceVariant that the Buyer is going to pay
    selectPriceVariant?: (product: Product, selectedVariant: ProductVariant, currency: string) => ProductPriceVariant;
    // the Base PriceVariant to get the Discount From
    basePriceVariant?: (product: Product, selectedVariant: ProductVariant, currency: string) => ProductPriceVariant;
};
