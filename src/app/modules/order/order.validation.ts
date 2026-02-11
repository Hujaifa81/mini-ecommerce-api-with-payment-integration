import { z } from "zod";
import { OrderStatus } from "../../../../generated/prisma/enums";

const updateOrderStatusZodSchema = z.object({
    status: z.enum(Object.values(OrderStatus) as [string]),
});

export const OrderValidation = {
    updateOrderStatusZodSchema,
};
