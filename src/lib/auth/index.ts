import { getServerSession } from 'next-auth'
import { authOptions } from './auth-options'

export { authOptions } from './auth-options'

export async function auth() {
  return getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Login required')
  }
  return session.user
}
