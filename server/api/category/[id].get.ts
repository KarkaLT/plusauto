import { getValidatedRouterParams } from 'h3'
import prisma from '~/lib/prisma'
import { z } from 'zod'

const categoryGetSchema = z.object({
  id: z.string().min(1, 'ID yra privalomas'),
})

// Retrieve one category by ID
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, categoryGetSchema.parse)

  const category = await prisma.category.findUnique({ where: { id } })

  if (!category) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Kategorija nerasta',
    })
  }

  const attributes = await prisma.attributeDefinition.findMany({ where: { categoryId: id } })

  return {
    ...category,
    attributes,
  }
})
