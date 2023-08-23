import { ContactDto } from "./contact.dto"
import { PsychologistDto } from "./psychologist.dto"
import { UserDto } from "./user.dto"

export type TherapyRequestDto = {
  _id: string

  timestamp: number

  name: string
  descr: string

  user?: UserDto
  psychologist?: PsychologistDto

  contacts: Array<ContactDto>

  accepted: boolean
}
