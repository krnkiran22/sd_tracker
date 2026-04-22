// Central helper so all fetch calls point to the backend API.
// Set NEXT_PUBLIC_API_URL=https://trackerservice-production.up.railway.app in both
// .env.local (dev) and Vercel dashboard (prod).
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

export function apiUrl(path: string): string {
  return `${BASE}${path}`
}
