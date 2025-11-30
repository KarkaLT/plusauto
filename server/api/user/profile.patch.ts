import { z } from 'zod'
import prisma from '~/lib/prisma'
import type { User } from '~/server/types/User'

const bodySchema = z.object({
  phoneNumber: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const extendedUser = user as User

  const { phoneNumber } = await readValidatedBody(event, bodySchema.parse)

  const updatedUser = await prisma.user.update({
    where: { id: extendedUser.id },
    data: { phoneNumber },
  })

  // Update session with new phone number
  await replaceUserSession(event, {
    user: {
      ...extendedUser,
      phoneNumber: updatedUser.phoneNumber,
    },
  })

  return { statusMessage: 'Profilis sėkmingai atnaujintas' }
})
