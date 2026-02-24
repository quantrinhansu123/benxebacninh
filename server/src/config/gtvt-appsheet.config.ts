import { z } from 'zod'
import { GtvtConfigError } from '../types/gtvt-sync.types.js'

const envSchema = z.object({
  baseUrl: z.string().trim().default(''),
  routesEndpoint: z.string().trim().min(1, 'GTVT_APPSHEET_ROUTES_ENDPOINT is required'),
  schedulesEndpoint: z.string().trim().min(1, 'GTVT_APPSHEET_SCHEDULES_ENDPOINT is required'),
  apiKey: z.string().trim().min(1, 'GTVT_APPSHEET_API_KEY is required'),
  authHeader: z.string().trim().default('ApplicationAccessKey'),
  timeoutMs: z.coerce.number().int().positive().max(120000).default(30000),
})

export interface GtvtAppsheetConfig {
  baseUrl: string
  routesEndpoint: string
  schedulesEndpoint: string
  apiKey: string
  authHeader: string
  timeoutMs: number
}

let cachedConfig: GtvtAppsheetConfig | null = null

const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value)

export function loadGtvtAppsheetConfig(): GtvtAppsheetConfig {
  if (cachedConfig) return cachedConfig

  const parsed = envSchema.safeParse({
    baseUrl: process.env.GTVT_APPSHEET_BASE_URL ?? '',
    routesEndpoint: process.env.GTVT_APPSHEET_ROUTES_ENDPOINT,
    schedulesEndpoint: process.env.GTVT_APPSHEET_SCHEDULES_ENDPOINT,
    apiKey: process.env.GTVT_APPSHEET_API_KEY,
    authHeader: process.env.GTVT_APPSHEET_AUTH_HEADER,
    timeoutMs: process.env.GTVT_APPSHEET_TIMEOUT_MS,
  })

  if (!parsed.success) {
    const message = parsed.error.errors.map((item) => item.message).join('; ')
    throw new GtvtConfigError(message)
  }

  const config = parsed.data
  const normalizedBase = config.baseUrl.replace(/\/+$/, '')

  if (!normalizedBase && (!isAbsoluteUrl(config.routesEndpoint) || !isAbsoluteUrl(config.schedulesEndpoint))) {
    throw new GtvtConfigError(
      'GTVT_APPSHEET_BASE_URL is required when endpoint is not absolute URL'
    )
  }

  cachedConfig = {
    baseUrl: normalizedBase,
    routesEndpoint: config.routesEndpoint,
    schedulesEndpoint: config.schedulesEndpoint,
    apiKey: config.apiKey,
    authHeader: config.authHeader,
    timeoutMs: config.timeoutMs,
  }

  return cachedConfig
}

export function clearGtvtAppsheetConfigCache(): void {
  cachedConfig = null
}

