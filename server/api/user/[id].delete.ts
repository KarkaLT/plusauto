import { getValidatedRouterParams } from 'h3'
import prisma from '~/lib/prisma'
import { z } from 'zod'
import type { User } from '~/server/types/User'

const userDeleteSchema = z.object({
  id: z.string().min(1, 'ID yra privalomas'),
})

// Delete a user by ID
export default defineEventHandler(async (event) => {
  // Require user to be logged in and admin
  const { user } = await requireUserSession(event)
  const extendedUser = user as User

  if (extendedUser.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Tik administratoriai gali ištrinti vartotojus',
    })
  }

  const { id } = await getValidatedRouterParams(event, userDeleteSchema.parse)

  // Check if user exists
  const targetUser = await prisma.user.findUnique({ where: { id } })

  if (!targetUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Vartotojas nerastas',
    })
  }

  // Prevent deleting self
  if (id === extendedUser.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Negalite ištrinti savęs',
    })
  }

  return prisma.user.delete({
    where: {
      id,
    },
  })
})
