import { getValidatedRouterParams } from 'h3'
import prisma from '~/lib/prisma'
import { z } from 'zod'

const listingIdSchema = z.object({
  id: z.string().min(1, 'ID is required'),
})

const listingUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  price: z.number().min(0, 'Price is required and must be a positive number').optional(),
})

// Update a listing
export default defineEventHandler(async (event) => {
  // Require user to be logged in
  const user = await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, listingIdSchema.parse)
  const body = await readBody(event)

  const result = listingUpdateSchema.safeParse(body)

  // Validate input
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: z.treeifyError(result.error),
    })
  }

  // Check if listing exists
  const listing = await prisma.listing.findUnique({ where: { id: id } })

  if (!listing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Listing not found',
    })
  }

  // Check if user owns the listing
  if (listing.authorId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You can only edit your own listings',
    })
  }

  const dataToUpdate: { title?: string; description?: string; price?: number } = {}
  if (result.data.title) {
    dataToUpdate.title = result.data.title
  }
  if (result.data.description) {
    dataToUpdate.description = result.data.description
  }
  if (result.data.price !== undefined) {
    dataToUpdate.price = result.data.price
  }

  return prisma.listing.update({
    where: {
      id: id,
    },
    data: dataToUpdate,
  })
})
