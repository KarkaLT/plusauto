import { getValidatedRouterParams } from 'h3';
import prisma from "~/lib/prisma";
import { z } from 'zod';

const commentDeleteSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

// Delete a comment by ID
export default defineEventHandler(async (event) => {
    const { id } = await getValidatedRouterParams(event, commentDeleteSchema.parse);

    // Check if comment exists
    if (!await prisma.comment.findUnique({ where: { id } })) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Comment not found',
        });
    }

    return prisma.comment.delete({
        where: {
            id,
        },
    });
});