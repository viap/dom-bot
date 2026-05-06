import { ContactDto } from "@/common/dto/contact.dto"
import { ROLES } from "@/common/enums/roles"

export type EditUserDto = {
  name?: string
  password?: string
  descr?: string
  roles?: Array<ROLES>
  contacts?: Array<ContactDto>
}
