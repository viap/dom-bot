import { CURRENCIES } from "@/common/enums/currencies"
import { UserDto } from "./user.dto"
import { ClientDto } from "./client.dto"

export type PsychologistDto = {
  _id: string
  user: UserDto
  currency: CURRENCIES
  sessionDurations: []
  education: []
  isInTheClub: boolean
  clients: Array<ClientDto>
}
