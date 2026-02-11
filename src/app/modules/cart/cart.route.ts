import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../../generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";
import { CartController } from "./cart.controller";
import { CartValidation } from "./cart.validation";

const router = Router();

router.get(
    "/",
    checkAuth(Role.CUSTOMER),
    CartController.getMyCart
);

router.post(
    "/add",
    checkAuth(Role.CUSTOMER),
    validateRequest(CartValidation.addToCartZodSchema),
    CartController.addToCart
);

router.patch(
    "/update/:itemId",
    checkAuth(Role.CUSTOMER),
    validateRequest(CartValidation.updateCartItemZodSchema),
    CartController.updateCartItemQuantity
);

router.delete(
    "/remove/:itemId",
    checkAuth(Role.CUSTOMER),
    CartController.removeCartItem
);

export default router;
