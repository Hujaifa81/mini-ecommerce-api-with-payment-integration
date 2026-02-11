import httpStatus from "http-status-codes";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../../lib/prisma";
import { Product } from "../../../../generated/prisma/client";

const createProduct = async (payload: Product) => {
    const isNameExist = await prisma.product.findUnique({
        where: { name: payload.name },
    });
    if (isNameExist) {
        throw new ApiError(httpStatus.CONFLICT, "Product with this name already exists");
    }

    const result = await prisma.product.create({
        data: payload,
    });
    return result;
};

const getAllProducts = async (query: any) => {
    const result = await prisma.product.findMany({
        orderBy: {
            createdAt: 'desc',
        },
    });
    return result;
};

const getSingleProduct = async (id: string) => {
    const result = await prisma.product.findUnique({
        where: { id },
    });
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    }
    return result;
};

const updateProduct = async (id: string, payload: Partial<Product>) => {
    const isProductExist = await prisma.product.findUnique({
        where: { id },
    });
    if (!isProductExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    }

    if (payload.name) {
        const isNameExist = await prisma.product.findUnique({
            where: { name: payload.name },
        });
        if (isNameExist && isNameExist.id !== id) {
            throw new ApiError(httpStatus.CONFLICT, "Product with this name already exists");
        }
    }

    const result = await prisma.product.update({
        where: { id },
        data: payload,
    });
    return result;
};

const deleteProduct = async (id: string) => {
    const isProductExist = await prisma.product.findUnique({
        where: { id },
    });
    if (!isProductExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    }

    const result = await prisma.product.delete({
        where: { id },
    });
    return result;
};

export const ProductService = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
};
