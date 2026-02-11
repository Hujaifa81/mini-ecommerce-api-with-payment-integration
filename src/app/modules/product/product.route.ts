import { Router } from "express";
import { ProductController } from "./product.controller";
import { ProductValidation } from "./product.validation";
import validateRequest from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../../generated/prisma/enums";

const router = Router();

router.get("/", ProductController.getAllProducts);
router.get("/:id", ProductController.getSingleProduct);

router.post(
    "/",
    checkAuth(Role.ADMIN),
    validateRequest(ProductValidation.createProductZodSchema),
    ProductController.createProduct
);

router.patch(
    "/:id",
    checkAuth(Role.ADMIN),
    validateRequest(ProductValidation.updateProductZodSchema),
    ProductController.updateProduct
);

router.delete(
    "/:id",
    checkAuth(Role.ADMIN),
    ProductController.deleteProduct
);

export default router;
