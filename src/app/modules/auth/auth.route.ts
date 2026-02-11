import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { AuthController } from "./auth.controller";
import { Role } from "../../../../generated/prisma/enums";

import {
  loginZodSchema,
  changePasswordZodSchema,
} from "./auth.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

router.post("/login", validateRequest(loginZodSchema), AuthController.credentialsLogin);
router.post("/refresh-token", AuthController.getNewAccessToken);
router.post("/logout", AuthController.logout);
router.post(
  "/change-password",
  checkAuth(...Object.values(Role)),
  validateRequest(changePasswordZodSchema),
  AuthController.changePassword
);


export default router;
