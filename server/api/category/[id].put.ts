import { getValidatedRouterParams } from "h3";
import prisma from "~/lib/prisma";
import {z} from 'zod';

const categoryIdSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

const categoryUpdateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
});

// Create a new category
export default defineEventHandler(async (event) => {
    const { id } = await getValidatedRouterParams(event, categoryIdSchema.parse);
    const body = await readBody(event);

    const result = categoryUpdateSchema.safeParse(body);

    // Validate input
    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Validation Error',
            data: z.treeifyError(result.error),
        });
    }

    // Check if category exists
    if (!await prisma.category.findUnique({where: {id: id}})) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Category not found',
        });
    }

    // Check if another category with the same name already exists
    const existingCategory = await prisma.category.findFirst({
        where: {
            name: result.data.name,
            id: {not: id},
        },
    });

    if (existingCategory) {
        throw createError({
            statusCode: 409,
            statusMessage: 'Another category with this name already exists',
        });
    }

    return prisma.category.update({
        where: {
            id: id,
        },
        data: {
            name: result.data.name,
            description: result.data.description,
        },
    });
});