/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../../shared/utils/catchAsync";
import { sendResponse } from "../../../shared/utils/sendResponse";
import { UserService } from "./user.service";
import { IJWTPayload } from "../../../interface/declare/index";



const getMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req?.user as IJWTPayload).userId as string;
  const result = await UserService.getMe(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User fetched successfully",
    data: result,
  });
});

export const UserController = {
  getMe,
};
