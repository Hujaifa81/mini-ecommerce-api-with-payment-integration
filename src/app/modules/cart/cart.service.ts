import httpStatus from "http-status-codes";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../../lib/prisma";

const addToCart = async (userId: string, payload: { productId: string; quantity: number }) => {
    const { productId, quantity } = payload;

    return await prisma.$transaction(async (tx) => {
        const products = await tx.$queryRaw<any[]>`
            SELECT * FROM products WHERE id = ${productId} FOR UPDATE
        `;

        if (products.length === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
        }

        const product = products[0];

        const cart = await tx.cart.upsert({
            where: { userId },
            update: {},
            create: { userId },
        });

        const existingCartItem = await tx.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId,
                },
            },
        });

        const currentQuantityInCart = existingCartItem?.quantity || 0;
        if (product.stock < currentQuantityInCart + quantity) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Adding ${quantity} more would exceed available stock (${product.stock}). You already have ${currentQuantityInCart} in cart.`
            );
        }

        return await tx.cartItem.upsert({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId,
                },
            },
            update: {
                quantity: {
                    increment: quantity,
                },
            },
            create: {
                cartId: cart.id,
                productId,
                quantity,
            },
        });
    });
};

const getMyCart = async (userId: string) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
    });

    return cart || { userId, items: [] };
};

const updateCartItemQuantity = async (userId: string, itemId: string, quantity: number) => {
    return await prisma.$transaction(async (tx) => {
        const cartItem = await tx.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true },
        });

        if (!cartItem || cartItem.cart.userId !== userId) {
            throw new ApiError(httpStatus.NOT_FOUND, "Cart item not found");
        }

        const products = await tx.$queryRaw<any[]>`
            SELECT * FROM products WHERE id = ${cartItem.productId} FOR UPDATE
        `;

        const product = products[0];

        if (!product) {
            throw new ApiError(httpStatus.NOT_FOUND, "Product not found or no longer available");
        }

        if (product.stock < quantity) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Insufficient stock");
        }

        return await tx.cartItem.update({
            where: { id: itemId },
            data: { quantity },
        });
    });
};

const removeCartItem = async (userId: string, itemId: string) => {
    const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
        throw new ApiError(httpStatus.NOT_FOUND, "Cart item not found");
    }

    return await prisma.cartItem.delete({
        where: { id: itemId },
    });
};

export const CartService = {
    addToCart,
    getMyCart,
    updateCartItemQuantity,
    removeCartItem,
};
