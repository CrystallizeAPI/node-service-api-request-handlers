import { Cart, CartHydraterArguments, CartItem, CartPayload, Price } from './types';
import { CrystallizeHydraterBySkus, ProductPriceVariant } from '@crystallize/js-api-client';
import type { ProductVariant, Product } from '@crystallize/js-api-client';

export const handleCartRequestPayload = async (payload: CartPayload, args: CartHydraterArguments): Promise<Cart> => {
    const skus = payload.items.map((item) => item.sku);
    const hydraterParameters = {
        skus,
        locale: payload.locale,
        ...args,
    };

    const hydrater = args.hydraterBySkus ?? CrystallizeHydraterBySkus;

    const response = await hydrater(
        hydraterParameters.skus,
        hydraterParameters.locale,
        hydraterParameters.extraQuery,
        hydraterParameters.perProduct,
        (item: string, index: number) => {
            return {
                ...(hydraterParameters.perVariant !== undefined ? hydraterParameters.perVariant(item, index) : {}),
                ...(payload.withImages === undefined || payload.withImages === false
                    ? {}
                    : {
                          images: {
                              url: true,
                              variants: {
                                  url: true,
                                  width: true,
                                  height: true,
                              },
                          },
                      }),
            };
        },
    );

    const products: Product[] = skus
        .map((sku: string, index: number) => response[`product${index}`])
        .filter((product) => !!product);

    let totals: Price = {
        gross: 0,
        currency: args.currency,
        net: 0,
        discounts: [
            {
                amount: 0,
                percent: 0,
            },
        ],
        taxAmount: 0,
    };

    const pricesHaveTaxesIncludedInCrystallize = args.pricesHaveTaxesIncludedInCrystallize ?? false;

    const items: CartItem[] = payload.items.map((item) => {
        let selectedVariant: ProductVariant | undefined;

        const product: Product | undefined = products.find((product: Product) => {
            selectedVariant = product?.variants?.find(
                (variant: Pick<ProductVariant, 'sku'>) => variant.sku === item.sku,
            ) as ProductVariant;
            return selectedVariant !== undefined ? product : undefined;
        });

        if (product === undefined) {
            throw new Error(`Could not find Product with sku ${item.sku}`);
        }

        if (selectedVariant === undefined) {
            throw new Error(`Could not find variant with sku ${item.sku}`);
        }

        // we need to pick the default price for the
        let selectedPrice: ProductPriceVariant;
        if (args.selectPriceVariant) {
            selectedPrice = args.selectPriceVariant(product, selectedVariant, args.currency);
        } else {
            selectedPrice = selectedVariant?.priceVariants?.[0] ?? { price: 0, identifier: 'undefined' };
        }

        let basePrice: ProductPriceVariant;
        if (args.basePriceVariant) {
            basePrice = args.basePriceVariant(product, selectedVariant, args.currency);
        } else {
            basePrice = {
                ...selectedPrice,
            };
        }

        const taxRate = (product?.vatType?.percent || 0) / 100;
        // these are the price in Crystallize
        const priceAmount = (selectedPrice?.price || 0) * item.quantity;
        const basePriceAmount = (basePrice?.price || 0) * item.quantity;
        const discount = {
            amount: basePriceAmount - priceAmount,
            percent: (basePriceAmount > 0 ? (basePriceAmount - priceAmount) / basePriceAmount : 0) * 100,
        };

        /**
         * NOTE: Google is pretty inconsistent here about NET PRICE versus GROSS PRICE.
         * We have to be opinionated about it
         * GROSS PRICE includes tax
         * NET PRICE is the price without tax
         */
        const netPrice = pricesHaveTaxesIncludedInCrystallize ? priceAmount / (1 + taxRate) : priceAmount;
        const grossPrice = pricesHaveTaxesIncludedInCrystallize ? priceAmount : priceAmount * (1 + taxRate);
        const taxAmount = grossPrice - netPrice;

        totals.taxAmount += taxAmount;
        totals.gross += grossPrice;
        totals.net += netPrice;
        totals.currency = args.currency;
        totals.discounts![0].amount += discount.amount || 0;

        return {
            quantity: item.quantity,
            price: {
                gross: grossPrice,
                net: netPrice,
                currency: args.currency,
                discounts: [discount],
                taxAmount,
            },
            variant: selectedVariant,
            variantPrice: selectedPrice,
            product,
        };
    });

    const cart: Cart = {
        total: {
            ...totals,
            discounts: [
                {
                    amount: totals.discounts![0].amount,
                    percent:
                        ((totals.net + totals.discounts![0].amount - totals.net) /
                            (totals.net + totals.discounts![0].amount)) *
                        100,
                },
            ],
        },
        cart: {
            items: items,
        },
    };
    return cart;
};
