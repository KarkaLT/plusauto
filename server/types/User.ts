import type { Role } from '@prisma/client'

export type User = {
  id: string
  name: string
  email: string
  role: Role
}
