import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

function createClient() {
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
  return new PrismaClient({ adapter })
}

const prisma = globalThis.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

export default prisma
