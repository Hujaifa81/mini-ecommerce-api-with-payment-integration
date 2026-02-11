/* eslint-disable @typescript-eslint/no-explicit-any */

import httpStatus from "http-status-codes";
import ApiError from "../../errors/ApiError.js";
import { prisma } from "../../../lib/prisma.js";


const getMe = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      authProviders: {
        select: {
          provider: true,
          providerId: true,
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safeUser } = result || {};

  return safeUser;
};

export const UserService = {
  getMe,
};
