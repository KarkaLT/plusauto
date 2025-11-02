import prisma from "~/lib/prisma";
import { z } from 'zod';

const categoryCreateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
});

// Create a new category
export default defineEventHandler(async (event) => {
    const body = await readBody(event);

    const result = categoryCreateSchema.safeParse(body);

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Validation Error',
            data: z.treeifyError(result.error),
        });
    }

    // Check if category with the same name already exists
    const existingCategory = await prisma.category.findUnique({
        where: { name: result.data.name },
    });

    if (existingCategory) {
        throw createError({
            statusCode: 409,
            statusMessage: 'Category with this name already exists',
        });
    }

    return prisma.category.create({
        data: {
            name: result.data.name,
            description: result.data.description,
        },
    });
});