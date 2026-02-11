/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status-codes";
import bcryptjs from "bcryptjs";
import { createNewAccessTokenWithRefreshToken } from "../../../shared/utils/userTokens";
import { IJWTPayload } from "../../../interface/declare/index";
import { prisma } from "../../../lib/prisma";
import ApiError from "../../errors/ApiError";
import ENV from "../../../config/env";
import { AuthProviderType } from "../../../../generated/prisma/enums";
import { User } from "../../../../generated/prisma/client";

const registerUser = async (payload: Partial<User>) => {
  const { email, password, ...rest } = payload;

  if (!email) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email is required");
  }
  if (!password) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password is required");
  }

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });
  if (isUserExist) {
    throw new ApiError(httpStatus.CONFLICT, "User already exists");
  }

  const hashedPassword = await bcryptjs.hash(password, Number(ENV.BCRYPT_SALT_ROUND));

  const result = await prisma.$transaction(async (tnx: any) => {
    const user = await tnx.user.create({
      data: {
        email,
        password: hashedPassword,
        ...rest,
      },
    });
    await tnx.authProvider.create({
      data: {
        provider: AuthProviderType.CREDENTIALS,
        providerId: email,
        userId: user.id,
      },
    });
    const userWithProviders = await tnx.user.findUnique({
      where: { id: user.id },
      include: {
        authProviders: {
          select: {
            provider: true,
            providerId: true,
          },
        },
      },
    });
    return userWithProviders;
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safeUser } = result || {};

  return safeUser;
};

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken);

  return {
    accessToken: newAccessToken,
  };
};

const changePassword = async (
  oldPassword: string,
  newPassword: string,
  decodedToken: IJWTPayload
) => {
  const user = await prisma.user.findUnique({
    where: { id: decodedToken.userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not exist");
  }

  const isOldPasswordMatch = await bcryptjs.compare(oldPassword, user?.password as string);

  if (!isOldPasswordMatch) {
    throw new ApiError(httpStatus.FORBIDDEN, "Old Password does not match");
  }

  user.password = await bcryptjs.hash(newPassword, Number(ENV.BCRYPT_SALT_ROUND));

  await prisma.user.update({
    where: { id: decodedToken.userId },
    data: user,
  });
};

export const AuthService = {
  registerUser,
  getNewAccessToken,
  changePassword,
};
