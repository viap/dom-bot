import { ContactDto } from "./contact.dto"
import {
  THERAPY_REQUEST_CATEGORY,
  THERAPY_REQUEST_CLIENT_GENDER,
} from "../enums/therapyRequestAnalytics"
import { PsychologistDto } from "./psychologist.dto"
import { UserDto } from "./user.dto"

export type TherapyRequestDto = {
  _id: string

  createdAt: string
  updatedAt: string

  name: string
  descr: string

  user?: UserDto
  psychologist?: PsychologistDto

  contacts: Array<ContactDto>

  accepted: boolean
  clientGender?: THERAPY_REQUEST_CLIENT_GENDER
  requestCategory?: THERAPY_REQUEST_CATEGORY
  analyticsReviewRequired?: boolean
  analyticsInference?: Record<
    "clientGender" | "requestCategory",
    {
      value: string
      confidence: number
      sources: Array<string>
      reasons: Array<string>
      detectedAt?: string
      reviewedAt?: string
      reviewedBy?: string
      manual: boolean
      selfReported?: boolean
    }
  >
}
