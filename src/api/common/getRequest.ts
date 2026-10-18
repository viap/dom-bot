import { MyContext } from "@/common/types/myContext"
import { AxiosRequestConfig, AxiosResponse } from "axios"
import { apiClient as axios } from "./apiClient"
import { getHeaders } from "./getHeaders"
import { getUrl } from "./getUrl"

export const DEFAULT_GET_TIMEOUT_MS = 60_000

export function getRequest<T>(
  ctx: MyContext,
  url: string,
  config?: AxiosRequestConfig
): Promise<T> | never {
  return axios
    .get(getUrl(url), {
      timeout: DEFAULT_GET_TIMEOUT_MS,
      ...config,
      headers: getHeaders(ctx, config),
    })
    .then((responce: AxiosResponse<T>) => {
      return responce.data
    })
}
