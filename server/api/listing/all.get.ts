import { getQuery } from 'h3'
import prisma from '~/lib/prisma'

// Retrieve all listings
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const categoryId = query.categoryId as string | undefined

  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })
    if (!category) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Category not found',
      })
    }
  }

  const where = categoryId ? { categoryId } : {}
  const include = categoryId ? { category: true } : {}

  return prisma.listing.findMany({
    where,
    include,
    orderBy: { createdAt: 'desc' },
  })
})
