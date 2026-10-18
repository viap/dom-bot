import { currentUserAlias } from "@/common/consts/currentUserAlias"
import { PsychologistDto } from "@/common/dto/psychologist.dto"
import { MyContext } from "@/common/types/myContext"
import { getRequest } from "../common/getRequest"
import { API_PATHS } from "../consts/apiPaths"
import { AxiosRequestConfig } from "axios"

export async function getPsychologist(
  ctx: MyContext,
  psychologistId: string = currentUserAlias,
  config?: AxiosRequestConfig
): Promise<PsychologistDto | null> {
  return getRequest<PsychologistDto | null>(
    ctx,
    API_PATHS.psychologists.one(psychologistId),
    config
  ).then((data) => data || null)
}
