/**
 * Generic AppSheet API v2 client for browser
 * Mirrors backend pattern from gtvt-appsheet-client.service.ts
 * POST-based with "Find" action + ApplicationAccessKey header
 */
import { appsheetConfig } from '@/config/appsheet.config'

const ARRAY_KEYS = ['data', 'rows', 'items', 'value', 'result', 'Data', 'Rows', 'Items', 'Value', 'Result']

/** Extract rows from flexible AppSheet response format */
function parseAppSheetResponse(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null && !Array.isArray(item)
    )
  }

  if (typeof payload === 'object' && payload !== null) {
    const obj = payload as Record<string, unknown>
    for (const key of ARRAY_KEYS) {
      const candidate = obj[key]
      if (Array.isArray(candidate) && candidate.length > 0) {
        return candidate.filter((item): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null && !Array.isArray(item)
        )
      }
    }
  }

  return []
}

/** Fetch with retry + exponential backoff */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retriesLeft: number,
): Promise<Response> {
  try {
    const response = await fetch(url, init)
    if (!response.ok && retriesLeft > 0 && response.status >= 500) {
      await new Promise(r => setTimeout(r, appsheetConfig.retryDelayMs * (appsheetConfig.retries - retriesLeft + 1)))
      return fetchWithRetry(url, init, retriesLeft - 1)
    }
    return response
  } catch (error) {
    if (retriesLeft > 0) {
      await new Promise(r => setTimeout(r, appsheetConfig.retryDelayMs * (appsheetConfig.retries - retriesLeft + 1)))
      return fetchWithRetry(url, init, retriesLeft - 1)
    }
    throw error
  }
}

/** Fetch all rows from an AppSheet table */
async function fetchTable(
  endpoint: string,
  signal?: AbortSignal,
): Promise<Record<string, unknown>[]> {
  if (!endpoint) throw new Error('AppSheet endpoint not configured')
  if (!appsheetConfig.apiKey) throw new Error('AppSheet API key not configured')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), appsheetConfig.timeoutMs)

  // Chain caller signal with timeout signal
  if (signal) {
    signal.addEventListener('abort', () => controller.abort())
  }

  try {
    const response = await fetchWithRetry(
      endpoint,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          [appsheetConfig.authHeader]: appsheetConfig.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ Action: 'Find', Properties: {}, Rows: [] }),
      },
      appsheetConfig.retries,
    )

    if (!response.ok) {
      throw new Error(`AppSheet API error: ${response.status}`)
    }

    const payload = await response.json()
    return parseAppSheetResponse(payload)
  } finally {
    clearTimeout(timeoutId)
  }
}

export const appsheetClient = { fetchTable }
