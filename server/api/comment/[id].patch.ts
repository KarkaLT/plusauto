import { getValidatedRouterParams } from "h3";
import prisma from "~/lib/prisma";
import {z} from 'zod';

const commentIdSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

const commentUpdateSchema = z.object({
    content: z.string().min(1, 'Content is required'),
});

// Update a comment
export default defineEventHandler(async (event) => {
    const { id } = await getValidatedRouterParams(event, commentIdSchema.parse);
    const body = await readBody(event);

    const result = commentUpdateSchema.safeParse(body);

    // Validate input
    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Validation Error',
            data: z.treeifyError(result.error),
        });
    }

    // Check if comment exists
    if (!await prisma.comment.findUnique({where: {id: id}})) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Comment not found',
        });
    }

    return prisma.comment.update({
        where: {
            id: id,
        },
        data: {
            content: result.data.content,
        },
    });
});