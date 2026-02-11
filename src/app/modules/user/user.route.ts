import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../../generated/prisma/enums";
import { UserController } from "./user.controller";


const router = Router();

router.get("/me", checkAuth(...Object.values(Role)), UserController.getMe);

export default router;
