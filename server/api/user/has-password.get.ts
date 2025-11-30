import prisma from '~/lib/prisma'
import type { User } from '~/server/types/User'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const extendedUser = user as User

  const dbUser = await prisma.user.findUnique({
    where: { id: extendedUser.id },
    select: { password: true },
  })

  return {
    hasPassword: !!dbUser?.password,
  }
})
