import { getValidatedRouterParams } from 'h3'
import prisma from '~/lib/prisma'
import { z } from 'zod'
import { Role } from '@prisma/client'

const categoryIdSchema = z.object({
  id: z.string().min(1, 'ID yra privalomas'),
})

const categoryUpdateSchema = z.object({
  name: z.string().min(1, 'Pavadinimas yra privalomas'),
  description: z.string().optional(),
})

// Update category
export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)

  if (user.role !== Role.ADMIN && user.role !== Role.MODERATOR) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Tik administratoriai gali atnaujinti kategorijas',
    })
  }

  const { id } = await getValidatedRouterParams(event, categoryIdSchema.parse)
  const body = await readBody(event)

  const result = categoryUpdateSchema.safeParse(body)

  // Validate input
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validacijos klaida',
      data: z.treeifyError(result.error),
    })
  }

  // Check if category exists
  if (!(await prisma.category.findUnique({ where: { id: id } }))) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Kategorija nerasta',
    })
  }

  // Check if another category with the same name already exists
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: result.data.name,
      id: { not: id },
    },
  })

  if (existingCategory) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Kita kategorija su tokiu pavadinimu jau egzistuoja',
    })
  }

  return prisma.category.update({
    where: {
      id: id,
    },
    data: {
      name: result.data.name,
      description: result.data.description,
    },
  })
})
