import axios, { AxiosInstance } from "axios"

const apiClient: AxiosInstance = axios.create()

apiClient.interceptors.request.use((config) => {
  if (process.env.NODE_ENV === "dev") {
    console.info(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    if (config.data) console.info("[API] Body:", config.data)
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "dev") {
      console.info(`[API] ${response.status} ${response.config.url}`)
    }
    return response
  },
  (error) => {
    if (process.env.NODE_ENV === "dev") {
      console.error(
        `[API] Error ${error.response?.status} ${error.config?.url}:`,
        error.message
      )
    }
    return Promise.reject(error)
  }
)

export { apiClient }
