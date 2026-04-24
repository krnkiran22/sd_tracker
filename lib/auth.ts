export type Role = 'admin' | 'logistics' | 'ingestion' | 'ingestion_lead' | 'user'

export const USERS: { email: string; password: string; role: Role; name: string }[] = [
  { email: 'ram@build.ai',       password: 'ram@build.ai', role: 'admin',          name: 'Ram (Admin)'       },
  { email: 'logi@gmail.com',     password: 'logistics',    role: 'logistics',      name: 'Logistics'         },
  { email: 'ingest@build.ai',    password: 'ingestion',    role: 'ingestion',      name: 'Ingestion Team'    },
  { email: 'kiran@build.ai',     password: 'kiran@build.ai', role: 'ingestion_lead', name: 'Kiran'           },
]

export interface AuthUser { email: string; role: Role; name: string }

export function getStoredAuth(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('sd_auth')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function storeAuth(user: AuthUser) {
  localStorage.setItem('sd_auth', JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem('sd_auth')
}
