import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../../shared/utils/catchAsync";
import { sendResponse } from "../../../shared/utils/sendResponse";
import { OrderService } from "./order.service";
import { IJWTPayload } from "../../../interface/declare";

const createOrderWithPayment = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IJWTPayload;
    const result = await OrderService.createOrderWithPayment(user.userId, user.email);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Order placed successfully. Please complete your payment.",
        data: result,
    });
});

const createOrderWithPayLater = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IJWTPayload;
    const result = await OrderService.createOrderWithPayLater(user.userId, user.email);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Order placed successfully. You can complete your payment later.",
        data: result,
    });
});

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IJWTPayload;
    const { id } = req.params;
    const result = await OrderService.initiatePayment(user.userId, user.email, id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment initiated successfully",
        data: result,
    });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IJWTPayload;
    const result = await OrderService.getMyOrders(user.userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Orders retrieved successfully",
        data: result,
    });
});

const getSingleOrder = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IJWTPayload;
    const { id } = req.params;
    const result = await OrderService.getSingleOrder(user.userId, id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order details retrieved successfully",
        data: result,
    });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
    const result = await OrderService.getAllOrders();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All orders retrieved successfully",
        data: result,
    });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await OrderService.updateOrderStatus(id as string, status);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order status updated successfully",
        data: result,
    });
});

const cancelOrder = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IJWTPayload;
    const { id } = req.params;
    const result = await OrderService.cancelOrder(id as string, user.userId, user.role);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order cancelled successfully",
        data: result,
    });
});

export const OrderController = {
    createOrderWithPayment,
    createOrderWithPayLater,
    initiatePayment,
    getMyOrders,
    getSingleOrder,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
};
