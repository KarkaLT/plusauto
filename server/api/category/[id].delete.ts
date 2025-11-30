import { getValidatedRouterParams } from 'h3'
import prisma from '~/lib/prisma'
import { z } from 'zod'
import { Role } from '@prisma/client'

const categoryDeleteSchema = z.object({
  id: z.string().min(1, 'ID yra privalomas'),
})

// Delete a category by ID
export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)

  if (user.role !== Role.ADMIN && user.role !== Role.MODERATOR) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Tik administratoriai gali ištrinti kategorijas',
    })
  }

  const { id } = await getValidatedRouterParams(event, categoryDeleteSchema.parse)

  // Check if category exists
  if (!(await prisma.category.findUnique({ where: { id } }))) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Kategorija nerasta',
    })
  }

  return prisma.category.delete({
    where: {
      id,
    },
  })
})
