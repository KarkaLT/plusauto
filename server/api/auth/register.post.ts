import { z } from 'zod'
import prisma from '~/lib/prisma'

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().max(100).optional(),
})

export default defineEventHandler(async (event) => {
  const { email, password, name } = await readValidatedBody(event, bodySchema.parse)

  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  })

  await setUserSession(event, {
    user: {
      name: user.name ?? 'User',
      id: user.id,
      role: user.role,
      email: user.email,
    },
  })
  return { statusMessage: 'Registration successful', user }
})
