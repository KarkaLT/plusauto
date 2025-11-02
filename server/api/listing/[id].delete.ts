import { getValidatedRouterParams } from 'h3';
import prisma from "~/lib/prisma";
import { z } from 'zod';

const listingDeleteSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

// Delete a listing by ID
export default defineEventHandler(async (event) => {
    const { id } = await getValidatedRouterParams(event, listingDeleteSchema.parse);

    // Check if listing exists
    if (!await prisma.listing.findUnique({ where: { id } })) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Listing not found',
        });
    }

    return prisma.listing.delete({
        where: {
            id,
        },
    });
});