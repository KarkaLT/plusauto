import prisma from '~/lib/prisma'
import { z } from 'zod'

const listingCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price is required and must be a positive number'),
  categoryId: z.string().min(1, 'Category ID is required'),
})

// Create a new listing
export default defineEventHandler(async (event) => {
  // Require user to be logged in
  const user = await requireUserSession(event)

  const body = await readBody(event)

  const result = listingCreateSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: z.treeifyError(result.error),
    })
  }

  // Check if category exists
  if (
    !(await prisma.category.findUnique({
      where: { id: result.data.categoryId },
    }))
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Category not found',
    })
  }

  return prisma.listing.create({
    data: {
      title: result.data.title,
      authorId: user.id,
      description: result.data.description,
      price: result.data.price,
      categoryId: result.data.categoryId,
    },
  })
})
