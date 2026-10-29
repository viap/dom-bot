import axios, { AxiosInstance, AxiosRequestConfig } from "axios"

interface RequestConfigWithMeta extends AxiosRequestConfig {
  metadata?: { startTime: number }
}

const apiClient: AxiosInstance = axios.create()
const SILENT_DEV_PATHS = new Set(["/application-messages/claim"])

const SECRET_KEYS = new Set([
  "password",
  "auth_token",
  "token",
  "startToken",
  "browserProof",
  "sessionToken",
  "currentSessionToken",
])

// Debug logs must not contain API client passwords or JWTs.
export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSecrets)
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SECRET_KEYS.has(key) ? "***" : redactSecrets(item),
      ])
    )
  }
  return value
}

export function shouldLogDevRequest(url?: string): boolean {
  if (!url) return true

  try {
    return !SILENT_DEV_PATHS.has(new URL(url, "http://local").pathname)
  } catch {
    return true
  }
}

apiClient.interceptors.request.use((config) => {
  const isDebug = process.env.API_DEBUG === "true"
  const isDev = process.env.NODE_ENV === "dev"

  if (isDebug) {
    ;(config as RequestConfigWithMeta).metadata = { startTime: Date.now() }
    const safeHeaders = { ...config.headers, Authorization: "Bearer ***" }
    console.debug(`[API DEBUG] → ${config.method?.toUpperCase()} ${config.url}`)
    console.debug("[API DEBUG] Headers:", safeHeaders)
    if (config.params) console.debug("[API DEBUG] Params:", config.params)
    if (config.data)
      console.debug("[API DEBUG] Body:", redactSecrets(config.data))
  } else if (isDev && shouldLogDevRequest(config.url)) {
    console.info(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    if (config.data) console.info("[API] Body:", redactSecrets(config.data))
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => {
    const isDebug = process.env.API_DEBUG === "true"
    const isDev = process.env.NODE_ENV === "dev"

    if (isDebug) {
      const startTime = (response.config as RequestConfigWithMeta).metadata
        ?.startTime
      const duration = startTime ? Date.now() - startTime : 0
      console.debug(
        `[API DEBUG] ← ${response.status} ${response.config.url} (${duration}ms)`
      )
      console.debug("[API DEBUG] Response data:", redactSecrets(response.data))
    } else if (isDev && shouldLogDevRequest(response.config.url)) {
      console.info(`[API] ${response.status} ${response.config.url}`)
    }

    return response
  },
  (error) => {
    const isDebug = process.env.API_DEBUG === "true"
    const isDev = process.env.NODE_ENV === "dev"

    if (isDebug) {
      const startTime = (error.config as RequestConfigWithMeta)?.metadata
        ?.startTime
      const duration = startTime ? Date.now() - startTime : 0
      console.debug(
        `[API DEBUG] ✗ ${error.response?.status} ${error.config?.url} (${duration}ms)`
      )
      console.debug(
        "[API DEBUG] Error body:",
        redactSecrets(error.response?.data)
      )
    } else if (isDev) {
      console.error(
        `[API] Error ${error.response?.status} ${error.config?.url}:`,
        error.message
      )
    }

    return Promise.reject(error)
  }
)

export { apiClient }
