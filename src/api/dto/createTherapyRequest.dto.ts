import { ContactDto } from "@/common/dto/contact.dto"
import {
  THERAPY_REQUEST_CATEGORY,
  THERAPY_REQUEST_CLIENT_GENDER,
} from "@/common/enums/therapyRequestAnalytics"

export type CreateTherapyRequestDto = {
  name: string
  descr: string
  user?: string
  psychologist?: string
  contacts: Array<ContactDto>
  clientGender?: THERAPY_REQUEST_CLIENT_GENDER
  requestCategory?: THERAPY_REQUEST_CATEGORY
}
