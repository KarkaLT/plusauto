import { getValidatedRouterParams } from 'h3'
import prisma from '~/lib/prisma'
import { z } from 'zod'
import type { User } from '~/server/types/User'

const commentDeleteSchema = z.object({
  id: z.string().min(1, 'ID yra privalomas'),
})

// Delete a comment by ID
export default defineEventHandler(async (event) => {
  // Require user to be logged in
  const { user } = await requireUserSession(event)
  const extendedUser = user as User

  const { id } = await getValidatedRouterParams(event, commentDeleteSchema.parse)

  // Check if comment exists
  const comment = await prisma.comment.findUnique({ where: { id } })

  if (!comment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Komentaras nerastas',
    })
  }

  // Check if user owns the comment or is admin
  if (comment.authorId !== extendedUser.id && extendedUser.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Galite ištrinti tik savo komentarą',
    })
  }

  return prisma.comment.delete({
    where: {
      id,
    },
  })
})
