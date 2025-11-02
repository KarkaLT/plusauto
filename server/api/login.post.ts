import { z } from 'zod'
import prisma from '~/lib/prisma'

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !(await verifyPassword(user.password, password))) {
    throw createError({
      statusCode: 401,
      message: 'Bad credentials',
    })
  }

  await setUserSession(event, {
    user: {
      name: user.name ?? 'User',
      id: user.id,
      role: user.role,
      email: user.email,
    },
  })
  return { statusMessage: 'Login successful' }
})
