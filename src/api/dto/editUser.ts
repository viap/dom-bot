import { ContactDto } from "@/common/dto/contact"
import { ROLES } from "@/common/enums/roles"

export type EditUserDto = {
  name?: string
  descr?: string
  roles?: Array<ROLES>
  contacts?: Array<ContactDto>
}
