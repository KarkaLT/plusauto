import type { Role } from '@prisma/client'

declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    picture?: string
    googleId?: string
    role: Role
    phoneNumber?: string
  }
}

export {}
