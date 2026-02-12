
import httpStatus from "http-status";
import { generateToken, verifyToken } from "../helper/jwtHelper";
import { IJWTPayload } from "../../interface/declare/index";
import ENV from "../../config/env";
import { prisma } from "../../lib/prisma";
import ApiError from "../../app/errors/ApiError";
import { User } from "../../../generated/prisma/client";





export const createUserTokens = (user: Partial<User>) => {
  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  const accessToken = generateToken(
    jwtPayload as IJWTPayload,
    ENV.JWT.JWT_ACCESS_SECRET,
    ENV.JWT.JWT_ACCESS_EXPIRES
  );

  const refreshToken = generateToken(
    jwtPayload as IJWTPayload,
    ENV.JWT.JWT_REFRESH_SECRET,
    ENV.JWT.JWT_REFRESH_EXPIRES
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const createNewAccessTokenWithRefreshToken = async (refreshToken: string) => {
  const verifiedRefreshToken = verifyToken(refreshToken, ENV.JWT.JWT_REFRESH_SECRET) as IJWTPayload;

  const isUserExist = await prisma.user.findUnique({
    where: {
      id: verifiedRefreshToken.userId,
    },
  });

  if (!isUserExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not exist");
  }

  if (isUserExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User is deleted");
  }

  const jwtPayload = {
    userId: isUserExist.id,
    email: isUserExist.email,
    role: isUserExist.role,
  };
  const accessToken = generateToken(
    jwtPayload,
    ENV.JWT.JWT_ACCESS_SECRET,
    ENV.JWT.JWT_ACCESS_EXPIRES
  );

  return accessToken;
};
