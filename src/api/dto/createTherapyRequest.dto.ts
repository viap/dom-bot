import { ContactDto } from "@/common/dto/contact.dto"

export type CreateTherapyRequestDto = {
  name: string
  descr: string
  user?: string
  psychologist?: string
  contacts: Array<ContactDto>
}
