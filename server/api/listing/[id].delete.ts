import { getValidatedRouterParams } from 'h3'
import prisma from '~/lib/prisma'
import { z } from 'zod'
import type { User } from '~/server/types/User'

const listingDeleteSchema = z.object({
  id: z.string().min(1, 'ID is required'),
})

// Delete a listing by ID
export default defineEventHandler(async (event) => {
  // Require user to be logged in
  const { user } = await requireUserSession(event)
  const extendedUser = user as User

  const { id } = await getValidatedRouterParams(event, listingDeleteSchema.parse)

  // Check if listing exists
  const listing = await prisma.listing.findUnique({ where: { id } })

  if (!listing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Listing not found',
    })
  }

  // Check if user owns the listing
  if (listing.authorId !== extendedUser.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You can only delete your own listings',
    })
  }

  return prisma.listing.delete({
    where: {
      id,
    },
  })
})
