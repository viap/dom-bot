import axios, { AxiosInstance, AxiosRequestConfig } from "axios"

interface RequestConfigWithMeta extends AxiosRequestConfig {
  metadata?: { startTime: number }
}

const apiClient: AxiosInstance = axios.create()

apiClient.interceptors.request.use((config) => {
  const isDebug = process.env.API_DEBUG === "true"
  const isDev = process.env.NODE_ENV === "dev"

  if (isDebug) {
    ;(config as RequestConfigWithMeta).metadata = { startTime: Date.now() }
    const safeHeaders = { ...config.headers, Authorization: "Bearer ***" }
    console.debug(`[API DEBUG] → ${config.method?.toUpperCase()} ${config.url}`)
    console.debug("[API DEBUG] Headers:", safeHeaders)
    if (config.params) console.debug("[API DEBUG] Params:", config.params)
    if (config.data) console.debug("[API DEBUG] Body:", config.data)
  } else if (isDev) {
    console.info(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    if (config.data) console.info("[API] Body:", config.data)
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
      console.debug("[API DEBUG] Response data:", response.data)
    } else if (isDev) {
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
      console.debug("[API DEBUG] Error body:", error.response?.data)
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
