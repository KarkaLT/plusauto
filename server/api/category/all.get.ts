import prisma from '~/lib/prisma'

// Retrieve all categories
export default defineEventHandler(() => {
  return prisma.category.findMany({ orderBy: { name: 'asc' } })
})
