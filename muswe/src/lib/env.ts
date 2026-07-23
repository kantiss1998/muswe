import { safeLogError } from './logger'

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_BASE_URL',
] as const

const serverEnvVars = [
  'DOKU_CLIENT_ID',
  'DOKU_SECRET_KEY',
  'BITESHIP_API_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ERP_API_KEY',
] as const

export function validateEnv(): void {
  const missing: string[] = requiredEnvVars.filter((key) => {
    const value = process.env[key]
    return !value || value.trim() === ''
  })

  // Validate server-only variables if running in Node environment
  if (typeof window === 'undefined') {
    const missingServer = serverEnvVars.filter((key) => {
      const value = process.env[key]
      return !value || value.trim() === ''
    })
    missing.push(...missingServer)
  }

  if (missing.length > 0) {
    const errorMessage =
      `❌ [Env Validation] Missing required environment variables:\n` +
      missing.map((key) => `   - ${key}`).join('\n') +
      `\n\nPlease check your .env.local file.`

    safeLogError('[Env Validation]', errorMessage)
    const isBuildPhase = process.env.npm_lifecycle_event === 'build' || process.env.NEXT_PHASE === 'phase-production-build'
    if (!isBuildPhase && process.env.NODE_ENV === 'production') {
      throw new Error(errorMessage)
    }
  }
}

// Automatically validate when imported in server-side context
if (typeof window === 'undefined') {
  validateEnv()
}
