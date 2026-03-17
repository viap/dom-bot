import { MyContext } from "@/common/types/myContext"
import { AxiosRequestConfig, AxiosResponse } from "axios"
import { apiClient as axios } from "./apiClient"
import { getHeaders } from "./getHeaders"
import { getUrl } from "./getUrl"

export function deleteRequest<T>(
  ctx: MyContext,
  url: string,
  config?: AxiosRequestConfig
): Promise<T> | never {
  return axios
    .delete(getUrl(url), {
      ...config,
      headers: getHeaders(ctx, config),
    })
    .then((responce: AxiosResponse<T>) => {
      return responce.data
    })
}
