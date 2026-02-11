import Stripe from "stripe";
import { stripe } from "../../../lib/stripe";
import ENV from "../../../config/env";
import { prisma } from "../../../lib/prisma";
import { PaymentStatus } from "../../../../generated/prisma/enums";

const createPaymentSession = async (orderData: {
    id: string;
    totalAmount: number;
    userEmail: string;
}) => {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: orderData.userEmail,
        line_items: [
            {
                price_data: {
                    currency: ENV.STRIPE.STRIPE_CURRENCY || "usd",
                    product_data: {
                        name: `Order #${orderData.id}`,
                    },
                    unit_amount: Math.round(orderData.totalAmount * 100), // Stripe expects cents
                },
                quantity: 1,
            },
        ],
        metadata: {
            orderId: orderData.id,
        },
        success_url: `${ENV.FRONTEND_URL}/payment/success?orderId=${orderData.id}`,
        cancel_url: `${ENV.FRONTEND_URL}/payment/cancel?orderId=${orderData.id}`,
    });

    return session.url;
};



const handleStripeWebhookEvent = async (sig: string, rawBody: Buffer) => {
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            ENV.STRIPE.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err: any) {
        throw new Error(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        const transactionId = session.id;

        if (orderId) {
            await prisma.$transaction(async (tx) => {
                const payment = await tx.payment.findUnique({
                    where: { orderId },
                });

                if (!payment) {
                    throw new Error(`Payment record for order ${orderId} not found`);
                }

                if (payment.status === PaymentStatus.COMPLETED) {
                    return;
                }

                await tx.payment.update({
                    where: { orderId },
                    data: {
                        status: PaymentStatus.COMPLETED,
                        transactionId,
                    },
                });
            });
        }
    }

    return { received: true };
};

export const PaymentService = {
    createPaymentSession,
    handleStripeWebhookEvent,
};