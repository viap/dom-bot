import { ROLES } from "@/common/enums/roles"
import { ContactDto } from "./contact.dto"

export type UserDto = {
  _id: string
  name: string
  descr: string
  roles: Array<ROLES>
  contacts: Array<ContactDto>
}
