import { Cart, CartHydraterArguments, CartItem, CartPayload } from './types';
import { CrystallizeHydraterBySkus, ProductPriceVariant } from '@crystallize/js-api-client';
import type { ProductVariant, Product } from '@crystallize/js-api-client';

export const handleCartRequestPayload = async (payload: CartPayload, args: CartHydraterArguments): Promise<Cart> => {
    const skus = payload.items.map((item) => item.sku);

    const hydraterParameters = {
        skus,
        locale: payload.locale,
        ...args,
    };

    const response = await CrystallizeHydraterBySkus(
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

    let totals = {
        gross: 0,
        currency: 'USD',
        net: 0,
        taxAmount: 0,
    };

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

        // it's odd but it can happen that the product has no price
        const selectedPrice: ProductPriceVariant =
            selectedVariant.priceVariants === undefined
                ? { price: 0, identifier: 'undefined' }
                : selectedVariant.priceVariants[0] || { price: 0, identifier: 'undefined' };
        const selectedCurrency =
            selectedVariant.priceVariants === undefined ? 'EUR' : selectedVariant.priceVariants[0].currency || 'EUR';
        const grossAmount = selectedPrice?.price || 0 * item.quantity;
        const taxAmount = (grossAmount * (product?.vatType?.percent || 0)) / 100;
        const netAmount = grossAmount + taxAmount;

        totals.taxAmount += taxAmount;
        totals.gross += grossAmount;
        totals.net += netAmount;
        totals.currency = selectedCurrency;

        return {
            quantity: item.quantity,
            price: {
                gross: grossAmount,
                net: netAmount,
                currency: selectedCurrency,
                taxAmount,
            },
            variant: selectedVariant,
            variantPrice: selectedPrice,
            product,
        };
    });

    const cart: Cart = {
        total: totals,
        cart: {
            items: items,
        },
    };
    return cart;
};
