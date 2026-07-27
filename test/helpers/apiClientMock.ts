import { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios"
import { apiClient } from "@/api/common/apiClient"

export type ApiClientCall = {
  method?: string
  url?: string
  data?: unknown
  params?: unknown
  headers?: unknown
}

export function withMockedApiClient(
  handler: (
    config: InternalAxiosRequestConfig
  ) => Pick<AxiosResponse, "status" | "data"> | Promise<Pick<AxiosResponse, "status" | "data">>
) {
  const calls: Array<ApiClientCall> = []
  const originalAdapter = apiClient.defaults.adapter

  apiClient.defaults.adapter = (async (config: InternalAxiosRequestConfig) => {
    calls.push({
      method: config.method,
      url: config.url,
      data:
        typeof config.data === "string"
          ? JSON.parse(config.data)
          : config.data,
      params: config.params,
      headers: config.headers,
    })
    const response = await handler(config)

    return {
      status: response.status,
      statusText: String(response.status),
      headers: {},
      config,
      data: response.data,
    }
  }) as AxiosAdapter

  return {
    calls,
    restore() {
      apiClient.defaults.adapter = originalAdapter
    },
  }
}
