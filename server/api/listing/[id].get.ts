import { getValidatedRouterParams } from 'h3'
import prisma from '~/lib/prisma'
import { z } from 'zod'

const listingGetSchema = z.object({
  id: z.string().min(1, 'ID yra privalomas'),
})

// Retrieve one listing by ID
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, listingGetSchema.parse)

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: true,
      attributes: {
        include: {
          attribute: true,
        },
      },
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
        },
      },
      category: true,
    },
  })

  if (!listing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Skelbimas nerastas',
    })
  }

  return listing
})
