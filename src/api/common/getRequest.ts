import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import { MyContext } from "@/common/types/myContext"
import { getHeaders } from "./getHeaders"
import { getUrl } from "./getUrl"

export function getRequest<T>(
  ctx: MyContext,
  url: string,
  urlParams?: object,
  config?: AxiosRequestConfig
): Promise<T> | never {
  return axios
    .get(getUrl(url, urlParams), {
      ...config,
      headers: getHeaders(ctx, config),
    })
    .then((responce: AxiosResponse<T>) => {
      return responce.data
    })
}
