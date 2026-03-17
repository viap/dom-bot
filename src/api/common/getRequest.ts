import { MyContext } from "@/common/types/myContext"
import { AxiosRequestConfig, AxiosResponse } from "axios"
import { apiClient as axios } from "./apiClient"
import { getHeaders } from "./getHeaders"
import { getUrl } from "./getUrl"

export function getRequest<T>(
  ctx: MyContext,
  url: string,
  config?: AxiosRequestConfig
): Promise<T> | never {
  return axios
    .get(getUrl(url), {
      ...config,
      headers: getHeaders(ctx, config),
    })
    .then((responce: AxiosResponse<T>) => {
      return responce.data
    })
}
