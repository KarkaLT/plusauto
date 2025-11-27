import { z } from 'zod'
import prisma from '~/lib/prisma'

const bodySchema = z.object({
  email: z.email('Neteisingas el. pašto formatas'),
  password: z.string().min(8, 'Slaptažodis turi būti bent 8 simbolių ilgio'),
  name: z
    .string()
    .min(2, 'Vardas turi būti bent 2 simbolių ilgio')
    .max(50, 'Vardas negali būti ilgesnis nei 50 simbolių')
    .optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Neteisingas telefono numerio formatas')
    .optional()
    .or(z.literal('')),
})

export default defineEventHandler(async (event) => {
  const { email, password, name, phoneNumber } = await readValidatedBody(event, bodySchema.parse)

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Vartotojas su šiuo el. paštu jau egzistuoja',
    })
  }

  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phoneNumber,
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
