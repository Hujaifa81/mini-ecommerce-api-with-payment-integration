import httpStatus from "http-status-codes";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../../lib/prisma";
import { OrderStatus } from "../../../../generated/prisma/enums";

const createOrder = async (userId: string) => {
    return await prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!cart || cart.items.length === 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Your cart is empty");
        }

        const productIds = cart.items.map((item) => item.productId);

        await tx.$queryRawUnsafe(`
      SELECT * FROM products WHERE id IN (${productIds.map((id) => `'${id}'`).join(",")}) FOR UPDATE
    `);

        const products = await tx.product.findMany({
            where: {
                id: { in: productIds },
            },
        });

        let totalAmount = 0;
        const orderItemsData = [];

        for (const cartItem of cart.items) {
            const product = products.find((p) => p.id === cartItem.productId);

            if (!product) {
                throw new ApiError(httpStatus.NOT_FOUND, `Product ${cartItem.productId} not found`);
            }

            if (product.stock < cartItem.quantity) {
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    `Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}`
                );
            }

            const itemPrice = Number(product.price);
            totalAmount += itemPrice * cartItem.quantity;

            orderItemsData.push({
                productId: cartItem.productId,
                quantity: cartItem.quantity,
                price: itemPrice,
            });

            await tx.product.update({
                where: { id: product.id },
                data: {
                    stock: {
                        decrement: cartItem.quantity,
                    },
                },
            });
        }

        const order = await tx.order.create({
            data: {
                userId,
                totalAmount,
                status: OrderStatus.PENDING,
                items: {
                    create: orderItemsData,
                },
            },
            include: {
                items: true,
            },
        });

        await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
        });

        return order;
    });
};

const getMyOrders = async (userId: string) => {
    return await prisma.order.findMany({
        where: { userId },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
            payment: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

const getSingleOrder = async (userId: string, orderId: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
            payment: true,
        },
    });

    if (!order || order.userId !== userId) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    return order;
};

const getAllOrders = async () => {
    return await prisma.order.findMany({
        include: {
            user: true,
            items: {
                include: {
                    product: true,
                },
            },
            payment: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    return await prisma.order.update({
        where: { id: orderId },
        data: { status },
    });
};

const cancelOrder = async (orderId: string) => {
    return await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });

        if (!order) {
            throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
        }

        if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                "Order cannot be cancelled in its current state"
            );
        }

        const result = await tx.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.CANCELLED },
        });

        for (const item of order.items) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        increment: item.quantity,
                    },
                },
            });
        }

        return result;
    });
};

export const OrderService = {
    createOrder,
    getMyOrders,
    getSingleOrder,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
};
