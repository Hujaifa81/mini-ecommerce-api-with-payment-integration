import { z } from "zod";

const addToCartZodSchema = z.object({
    productId: z.string({
        error: "Product ID is required",
    }).uuid("Invalid Product ID format"),
    quantity: z.number({
        error: "Quantity is required",
    }).int("Quantity must be an integer").positive("Quantity must be at least 1"),
});

const updateCartItemZodSchema = z.object({
    quantity: z.number({
        error: "Quantity is required",
    }).int("Quantity must be an integer").positive("Quantity must be at least 1"),
});

export const CartValidation = {
    addToCartZodSchema,
    updateCartItemZodSchema,
};
