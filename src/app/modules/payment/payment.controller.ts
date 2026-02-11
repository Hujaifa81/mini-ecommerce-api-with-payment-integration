import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../../shared/utils/catchAsync";
import { sendResponse } from "../../../shared/utils/sendResponse";
import { PaymentService } from "./payment.service";

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const result = await PaymentService.handleStripeWebhookEvent(sig, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Webhook processed successfully",
        data: result,
    });
});

export const PaymentController = {
    handleStripeWebhook,
};
