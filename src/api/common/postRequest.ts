import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import { MyContext } from "../../types/myContext"
import { getHeaders } from "./getHeaders"
import { getUrl } from "./getUrl"

export function postRequest<T>(
  ctx: MyContext,
  url: string,
  params?: object,
  data?: object,
  config?: AxiosRequestConfig
): Promise<T> | never {
  return axios
    .post(getUrl(url, params), data, {
      ...config,
      headers: getHeaders(ctx, config),
    })
    .then((responce: AxiosResponse<T>) => {
      return responce.data
    })
}
