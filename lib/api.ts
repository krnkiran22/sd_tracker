// Central helper so all fetch calls point to the backend API.
// In development: leave NEXT_PUBLIC_API_URL unset (empty) so calls hit localhost:4000
// In production (Vercel): set NEXT_PUBLIC_API_URL=https://your-backend.railway.app
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

export function apiUrl(path: string): string {
  return `${BASE}${path}`
}
