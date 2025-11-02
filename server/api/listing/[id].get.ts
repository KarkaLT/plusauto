import { getValidatedRouterParams } from 'h3';
import prisma from "~/lib/prisma";
import { z } from "zod";

const listingGetSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

// Retrieve one listing by ID
export default defineEventHandler(async (event) => {
    const { id } = await getValidatedRouterParams(event, listingGetSchema.parse);

    const category = await prisma.listing.findUnique({ where: { id } });

    if (!category) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Listing not found',
        });
    }

    return category;
});
