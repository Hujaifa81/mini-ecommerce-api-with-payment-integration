import { z } from "zod";

const createProductZodSchema = z.object({
    name: z.string({
        error: "Product name must be a string",
    }).min(2, "Product name must be at least 2 characters long"),

    description: z.string().optional(),

    price: z.number({
        error: "Price must be a number",
    }).positive("Price must be a positive number"),

    stock: z.number({
        error: "Stock must be a number",
    }).int("Stock must be an integer").nonnegative("Stock cannot be negative"),
});

const updateProductZodSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().nonnegative().optional(),
});

export const ProductValidation = {
    createProductZodSchema,
    updateProductZodSchema,
};
