/**
 * AppSheet API config - reads from Vite env vars (VITE_ prefix required)
 * Used for frontend direct polling to AppSheet GTVT tables
 */
export const appsheetConfig = {
  apiKey: import.meta.env.VITE_GTVT_APPSHEET_API_KEY || '',
  authHeader: 'ApplicationAccessKey',
  timeoutMs: 10_000,
  retries: 2,
  retryDelayMs: 500,
  // Table endpoints - expand as we add more tables
  endpoints: {
    vehicles: import.meta.env.VITE_GTVT_APPSHEET_VEHICLES_ENDPOINT || '',
  } as Record<string, string>,
}
