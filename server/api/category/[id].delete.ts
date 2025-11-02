import { getValidatedRouterParams } from 'h3';
import prisma from "~/lib/prisma";
import { z } from 'zod';

const categoryDeleteSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

// Delete a category by ID
export default defineEventHandler(async (event) => {
    const { id } = await getValidatedRouterParams(event, categoryDeleteSchema.parse);

    // Check if category exists
    if (!await prisma.category.findUnique({ where: { id } })) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Category not found',
        });
    }

    return prisma.category.delete({
        where: {
            id,
        },
    });
});