import prisma from '~/lib/prisma'

// Retrieve all users
export default defineEventHandler(async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })
})
