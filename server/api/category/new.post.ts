import prisma from '~/lib/prisma'
import { z } from 'zod'
import { Role } from '@prisma/client'

const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Pavadinimas yra privalomas'),
  description: z.string().optional(),
})

// Create a new category
export default defineEventHandler(async (event) => {
  const user = await requireUserSession(event)

  if (user.role !== Role.ADMIN && user.role !== Role.MODERATOR) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Tik administratoriai gali kurti kategorijas',
    })
  }

  const body = await readBody(event)

  const result = categoryCreateSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validacijos klaida',
      data: z.treeifyError(result.error),
    })
  }

  // Check if category with the same name already exists
  const existingCategory = await prisma.category.findUnique({
    where: { name: result.data.name },
  })

  if (existingCategory) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Kategorija su tokiu pavadinimu jau egzistuoja',
    })
  }

  return prisma.category.create({
    data: {
      name: result.data.name,
      description: result.data.description,
    },
  })
})
