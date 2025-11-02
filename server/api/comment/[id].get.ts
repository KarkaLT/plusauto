import { getValidatedRouterParams } from 'h3';
import prisma from "~/lib/prisma";
import { z } from "zod";

const commentGetSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

// Retrieve one comment by ID
export default defineEventHandler(async (event) => {
    const { id } = await getValidatedRouterParams(event, commentGetSchema.parse);

    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Comment not found',
        });
    }

    return comment;
});
