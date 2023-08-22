import { ContactDto } from "../../common/dto/contact.dto"

export type UpdateTherapyRequestDto = {
  name?: string
  psychologist?: string
  user?: string
  descr?: string
  contacts: Array<ContactDto>
}
