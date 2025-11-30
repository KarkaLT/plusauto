import { getValidatedRouterParams } from 'h3'
import prisma from '~/lib/prisma'
import { z } from 'zod'
import type { User } from '~/server/types/User'

const listingIdSchema = z.object({
  id: z.string().min(1, 'ID yra privalomas'),
})

const listingUpdateSchema = z.object({
  title: z.string().min(1, 'Pavadinimas yra privalomas').optional(),
  description: z.string().optional(),
  price: z.number().min(0, 'Kaina yra privaloma ir turi būti teigiamas skaičius').optional(),
})

// Update a listing
export default defineEventHandler(async (event) => {
  // Require user to be logged in
  const { user } = await requireUserSession(event)
  const extendedUser = user as User

  const { id } = await getValidatedRouterParams(event, listingIdSchema.parse)
  const body = await readBody(event)

  const result = listingUpdateSchema.safeParse(body)

  // Validate input
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validacijos klaida',
      data: z.treeifyError(result.error),
    })
  }

  // Check if listing exists
  const listing = await prisma.listing.findUnique({ where: { id: id } })

  if (!listing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Skelbimas nerastas',
    })
  }

  // Check if user owns the listing
  if (listing.authorId !== extendedUser.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Galite redaguoti tik savo skelbimą',
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
