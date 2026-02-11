import Stripe from "stripe";
import ENV from "../config/env";

export const stripe = new Stripe(ENV.STRIPE.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-12-18.acacia" as any,
});
