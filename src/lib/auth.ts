import { getAuthSession } from '@/utils/libs/auth-helpers'

export async function auth() {
  return await getAuthSession()
}
