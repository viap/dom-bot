import { MyContext } from "@/common/types/myContext"
import { AxiosRequestConfig, AxiosResponse } from "axios"
import { apiClient as axios } from "./apiClient"
import { getHeaders } from "./getHeaders"
import { getUrl } from "./getUrl"

export function postRequest<T>(
  ctx: MyContext,
  url: string,
  data?: object,
  config?: AxiosRequestConfig
): Promise<T> | never {
  return axios
    .post(getUrl(url), data, {
      ...config,
      headers: getHeaders(ctx, config),
    })
    .then((responce: AxiosResponse<T>) => {
      return responce.data
    })
}
