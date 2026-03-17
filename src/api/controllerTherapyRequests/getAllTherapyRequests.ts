import { TherapyRequestDto } from "@/common/dto/therapyRequest.dto"
import { MyContext } from "@/common/types/myContext"
import { ObjectWithPrimitiveValues } from "@/common/types/objectWithPrimitiveValues"
import { getRequest } from "../common/getRequest"
import { API_PATHS } from "../consts/apiPaths"

export async function getAllTherapyRequests(
  ctx: MyContext,
  params?: ObjectWithPrimitiveValues
): Promise<Array<TherapyRequestDto>> {
  return getRequest(ctx, API_PATHS.therapyRequests.all, {
    params,
  })
}
