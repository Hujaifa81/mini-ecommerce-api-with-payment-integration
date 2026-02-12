import httpStatus from "http-status-codes";
import { Prisma } from "../../../../generated/prisma/client";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../../lib/prisma";
import { OrderStatus, PaymentStatus, Role } from "../../../../generated/prisma/enums";
import { PaymentService } from "../payment/payment.service";

const createBaseOrder = async (tx: Prisma.TransactionClient, userId: string) => {
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

    // 1. Anti-Fraud: Limit the number of concurrent PENDING orders to prevent stock "jailing"
    // (If a user has too many unpaid/undelivered orders, they shouldn't lock up more stock)
    const pendingOrderCount = await tx.order.count({
        where: {
            userId,
            status: OrderStatus.PENDING,
        },
    });

    if (pendingOrderCount >= 5) {
        throw new ApiError(
            httpStatus.TOO_MANY_REQUESTS,
            "You have too many pending orders. Please complete your existing payments or wait for fulfillment before placing new orders."
        );
    }

    const productIds = cart.items.map((item: { productId: string }) => item.productId);

    await tx.$queryRawUnsafe(`
        SELECT * FROM products WHERE id IN (${productIds.map((id: string) => `'${id}'`).join(",")}) FOR UPDATE
    `);

    const products = await tx.product.findMany({
        where: {
            id: { in: productIds },
        },
    });

    let totalAmount = 0;
    const orderItemsData = [];

    for (const cartItem of cart.items) {
        const product = products.find((p: { id: string }) => p.id === cartItem.productId);

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

    return { order, totalAmount };
};

const createOrderWithPayment = async (userId: string, userEmail: string) => {
    const result = await prisma.$transaction(async (tx) => {
        const { order, totalAmount } = await createBaseOrder(tx, userId);

        await tx.payment.create({
            data: {
                orderId: order.id,
                amount: totalAmount,
                status: PaymentStatus.PENDING,
                paymentMethod: "stripe",
            },
        });

        return order;
    });

    const paymentUrl = await PaymentService.createPaymentSession({
        id: result.id,
        totalAmount: Number(result.totalAmount),
        userEmail,
    });

    return { paymentUrl, order: result };
};

const createOrderWithPayLater = async (userId: string, userEmail: string) => {
    return await prisma.$transaction(async (tx) => {
        const { order } = await createBaseOrder(tx, userId);
        return order;
    });
};

const initiatePayment = async (userId: string, userEmail: string, orderId: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId, userId },
        include: { payment: true },
    });

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    if (order.payment && order.payment.status === PaymentStatus.COMPLETED) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Order is already paid");
    }

    if (order.payment) {
        if (order.payment.status === PaymentStatus.FAILED) {
            await prisma.payment.update({
                where: { id: order.payment.id },
                data: { status: PaymentStatus.PENDING },
            });
        }
    } else {
        await prisma.payment.create({
            data: {
                orderId,
                amount: order.totalAmount,
                status: PaymentStatus.PENDING,
                paymentMethod: "stripe",
            },
        });
    }

    const paymentUrl = await PaymentService.createPaymentSession({
        id: order.id,
        totalAmount: Number(order.totalAmount),
        userEmail: userEmail,
    });

    return { paymentUrl };
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

const cancelOrder = async (orderId: string, userId: string, userRole: Role) => {
    return await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: true, payment: true },
        });

        if (!order) {
            throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
        }

        // 1. Ownership Check: Customers can only cancel their own orders
        if (userRole === Role.CUSTOMER && order.userId !== userId) {
            throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to cancel this order");
        }

        // 2. Status Restriction: Only allow cancellation if not delivered or already cancelled
        if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                "Order cannot be cancelled in its current state"
            );
        }

        // 3. Payment Protection: Customers cannot cancel if payment is already COMPLETED
        // (If paid, they must contact Admin for a refund flow)
        if (userRole === Role.CUSTOMER && order.payment?.status === PaymentStatus.COMPLETED) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                "Paid orders cannot be cancelled by customers. Please contact support."
            );
        }

        // 4. Rate Limiting: Prevent "cancellation spam" (Max 3 cancellations per day for customers)
        if (userRole === Role.CUSTOMER) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const cancellationCount = await tx.order.count({
                where: {
                    userId,
                    status: OrderStatus.CANCELLED,
                    updatedAt: {
                        gte: today,
                    },
                },
            });

            if (cancellationCount >= 3) {
                throw new ApiError(
                    httpStatus.TOO_MANY_REQUESTS,
                    "Daily cancellation limit reached. Please contact support for further assistance."
                );
            }
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

const cancelExpiredOrders = async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const expiredOrders = await prisma.order.findMany({
        where: {
            status: OrderStatus.PENDING,
            createdAt: {
                lt: thirtyMinutesAgo,
            },
        },
        include: {
            items: true,
            payment: true,
        },
    });

    if (expiredOrders.length === 0) {
        return;
    }

    console.log(`[Cron] Found ${expiredOrders.length} expired orders. Processing...`);

    for (const order of expiredOrders) {
        if (order.payment?.status === PaymentStatus.COMPLETED) {
            continue;
        }

        try {
            await prisma.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id: order.id },
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
            });
            console.log(`[Cron] Order ${order.id} automatically cancelled due to payment expiry.`);
        } catch (error) {
            console.error(`[Cron] Failed to cancel order ${order.id}:`, error);
        }
    }
};

export const OrderService = {
    createOrderWithPayment,
    createOrderWithPayLater,
    initiatePayment,
    getMyOrders,
    getSingleOrder,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    cancelExpiredOrders,
};
