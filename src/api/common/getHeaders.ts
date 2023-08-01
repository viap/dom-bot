import { AxiosHeaders, AxiosRequestConfig } from "axios"
import { MyContext } from "../../types/myContext"

export function getHeaders(
  ctx: MyContext,
  config?: AxiosRequestConfig
): AxiosHeaders {
  const newHeaders = (config?.headers || {}) as AxiosHeaders
  newHeaders.Authorization = "Bearer " + ctx.session.token
  return newHeaders
}
