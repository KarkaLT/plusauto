import { getValidatedRouterParams } from 'h3'
import prisma from '~/lib/prisma'
import { z } from 'zod'
import type { User } from '~/server/types/User'

const commentIdSchema = z.object({
  id: z.string().min(1, 'ID yra privalomas'),
})

const commentUpdateSchema = z.object({
  content: z.string().min(1, 'Turinys yra privalomas'),
})

// Update a comment
export default defineEventHandler(async (event) => {
  // Require user to be logged in
  const { user } = await requireUserSession(event)
  const extendedUser = user as User

  const { id } = await getValidatedRouterParams(event, commentIdSchema.parse)
  const body = await readBody(event)

  const result = commentUpdateSchema.safeParse(body)

  // Validate input
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validacijos klaida',
      data: z.treeifyError(result.error),
    })
  }

  // Check if comment exists
  const comment = await prisma.comment.findUnique({ where: { id: id } })

  if (!comment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Komentaras nerastas',
    })
  }

  // Check if user owns the comment
  if (comment.authorId !== extendedUser.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Galite redaguoti tik savo komentarą',
    })
  }

  return prisma.comment.update({
    where: {
      id: id,
    },
    data: {
      content: result.data.content,
    },
  })
})
