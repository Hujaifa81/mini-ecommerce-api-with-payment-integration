import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../../generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";
import { OrderController } from "./order.controller";
import { OrderValidation } from "./order.validation";
import { paymentLimiter } from "../../middlewares/rateLimiter";

const router = Router();

router.post(
    "/",
    paymentLimiter,
    checkAuth(Role.CUSTOMER),
    OrderController.createOrderWithPayment
);

router.post(
    "/pay-later",
    paymentLimiter,
    checkAuth(Role.CUSTOMER),
    OrderController.createOrderWithPayLater
);

router.post(
    "/:id/initiate-payment",
    paymentLimiter,
    checkAuth(Role.CUSTOMER),
    OrderController.initiatePayment
)

router.get(
    "/my-orders",
    checkAuth(Role.CUSTOMER),
    OrderController.getMyOrders
);

router.get(
    "/:id",
    checkAuth(Role.CUSTOMER),
    OrderController.getSingleOrder
);


router.get(
    "/all/all-orders",
    checkAuth(Role.ADMIN),
    OrderController.getAllOrders
);

router.patch(
    "/:id/status",
    checkAuth(Role.ADMIN),
    validateRequest(OrderValidation.updateOrderStatusZodSchema),
    OrderController.updateOrderStatus
);

router.patch(
    "/:id/cancel",
    checkAuth(Role.CUSTOMER, Role.ADMIN),
    OrderController.cancelOrder
);

export default router;
