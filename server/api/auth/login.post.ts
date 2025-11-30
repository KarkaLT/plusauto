import { z } from 'zod'
import prisma from '~/lib/prisma'

const bodySchema = z.object({
  email: z.email('Neteisingas el. pašto formatas'),
  password: z.string().min(8, 'Slaptažodis turi būti bent 8 simbolių ilgio'),
})

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse)

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Neteisingas el. paštas arba slaptažodis',
    })
  }

  if (!user.password) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Šiai paskyrai naudojamas Google prisijungimas',
    })
  }

  if (!(await verifyPassword(user.password, password))) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Neteisingas el. paštas arba slaptažodis',
    })
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? '',
      picture: user.picture ?? undefined,
      googleId: user.googleId ?? undefined,
      role: user.role,
    },
  })
  return { statusMessage: 'Login successful' }
})
