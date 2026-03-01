/**
 * Generic AppSheet polling hook - reusable for any table
 * Features: interval polling, tab visibility pause/resume, hash-based diff
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { appsheetConfig } from '@/config/appsheet.config'
import { appsheetClient } from '@/services/appsheet-client.service'

interface UseAppSheetPollingOptions<TNormalized> {
  /** Key from appsheetConfig.endpoints (e.g. 'vehicles') */
  endpointKey: string
  /** Transform raw rows → app-compatible format */
  normalize: (rows: Record<string, unknown>[]) => TNormalized[]
  /** Called with normalized data when diff detected */
  onData: (data: TNormalized[], isInitial: boolean) => void
  /** Optional: push data to backend for DB persistence */
  onSyncToDb?: (data: TNormalized[]) => void
  /** Polling interval in ms (default: 10000) */
  intervalMs?: number
  /** Enable/disable polling (default: true) */
  enabled?: boolean
}

interface UseAppSheetPollingResult {
  isPolling: boolean
  lastPollAt: Date | null
  error: string | null
  pollNow: () => void
}

/** Compact hash for change detection (cyrb53 - fast, low collision) */
function hashData(data: unknown): string {
  const str = JSON.stringify(data)
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

export function useAppSheetPolling<TNormalized>(
  options: UseAppSheetPollingOptions<TNormalized>,
): UseAppSheetPollingResult {
  const {
    endpointKey,
    normalize,
    onData,
    onSyncToDb,
    intervalMs = 10_000,
    enabled = true,
  } = options

  const [isPolling, setIsPolling] = useState(false)
  const [lastPollAt, setLastPollAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Refs to avoid stale closures
  const lastHashRef = useRef<string>('')
  const isFirstPollRef = useRef(true)
  const abortRef = useRef<AbortController | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Stable refs for callbacks to avoid re-creating interval
  const normalizeRef = useRef(normalize)
  normalizeRef.current = normalize
  const onDataRef = useRef(onData)
  onDataRef.current = onData
  const onSyncToDbRef = useRef(onSyncToDb)
  onSyncToDbRef.current = onSyncToDb

  const endpoint = appsheetConfig.endpoints[endpointKey]

  const doPoll = useCallback(async () => {
    if (!endpoint || !appsheetConfig.apiKey) return

    // Abort previous in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setIsPolling(true)
      const rawRows = await appsheetClient.fetchTable(endpoint, controller.signal)
      const normalized = normalizeRef.current(rawRows)

      // Hash-based diff: skip update if data unchanged
      const hash = hashData(normalized)
      if (hash !== lastHashRef.current) {
        lastHashRef.current = hash
        const isInitial = isFirstPollRef.current
        isFirstPollRef.current = false
        onDataRef.current(normalized, isInitial)

        // Background DB sync (fire-and-forget, properly handle async)
        if (onSyncToDbRef.current) {
          Promise.resolve().then(() => onSyncToDbRef.current?.(normalized)).catch(() => {/* silent */})
        }
      }

      setLastPollAt(new Date())
      setError(null)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Unknown polling error'
      console.warn(`[AppSheet poll] ${endpointKey}: ${msg}`)
      setError(msg)
    } finally {
      setIsPolling(false)
    }
  }, [endpoint, endpointKey])

  // Setup polling + visibility listener
  useEffect(() => {
    if (!enabled || !endpoint) return

    // Immediate first poll
    doPoll()

    // Interval polling
    intervalRef.current = setInterval(doPoll, intervalMs)

    // Pause when tab hidden, resume + immediate poll when visible
    const handleVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        // Clear any stale interval before creating new one
        if (intervalRef.current) clearInterval(intervalRef.current)
        doPoll()
        intervalRef.current = setInterval(doPoll, intervalMs)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      abortRef.current?.abort()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [enabled, endpoint, intervalMs, doPoll])

  return { isPolling, lastPollAt, error, pollNow: doPoll }
}
