import { z } from 'zod'
import prisma from '~/lib/prisma'
import type { User } from '~/server/types/User'

const bodySchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, 'Slaptažodis turi būti bent 8 simbolių ilgio'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Slaptažodžiai nesutampa',
    path: ['confirmPassword'],
  })

export default defineEventHandler(async (event) => {
  // Ensure user is authenticated
  const { user } = await requireUserSession(event)
  const extendedUser = user as User

  const { currentPassword, newPassword } = await readValidatedBody(event, bodySchema.parse)

  // Get the user from database
  const dbUser = await prisma.user.findUnique({
    where: { id: extendedUser.id },
  })

  if (!dbUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Nepavyko rasti vartotojo',
    })
  }

  // If user has an existing password, verify the current password
  if (dbUser.password) {
    if (!currentPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Dabartinis slaptažodis yra privalomas',
      })
    }

    const isValidPassword = await verifyPassword(dbUser.password!, currentPassword)
    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Neteisingas dabartinis slaptažodis',
      })
    }
  }

  // Hash the new password
  const hashedPassword = await hashPassword(newPassword)

  // Update the user's password
  await prisma.user.update({
    where: { id: dbUser.id },
    data: { password: hashedPassword },
  })

  return { statusMessage: 'Slaptažodis sekmingai atnaujintas' }
})
