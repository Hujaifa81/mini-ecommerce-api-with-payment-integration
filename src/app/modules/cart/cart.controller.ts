import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../../shared/utils/catchAsync";
import { sendResponse } from "../../../shared/utils/sendResponse";
import { CartService } from "./cart.service";
import { IJWTPayload } from "../../../interface/declare";

const addToCart = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IJWTPayload;
    const result = await CartService.addToCart(user.userId, req.body);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Item added to cart successfully",
        data: result,
    });
});

const getMyCart = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IJWTPayload;
    const result = await CartService.getMyCart(user.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Cart retrieved successfully",
        data: result,
    });
});

const updateCartItemQuantity = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IJWTPayload;
    const { itemId } = req.params;
    const { quantity } = req.body;
    const result = await CartService.updateCartItemQuantity(user.userId, itemId as string, quantity);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Cart item quantity updated successfully",
        data: result,
    });
});

const removeCartItem = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as IJWTPayload;
    const { itemId } = req.params;
    const result = await CartService.removeCartItem(user.userId, itemId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Item removed from cart successfully",
        data: result,
    });
});

export const CartController = {
    addToCart,
    getMyCart,
    updateCartItemQuantity,
    removeCartItem,
};
