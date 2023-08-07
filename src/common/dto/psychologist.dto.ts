import { CURRENCIES } from "../enums/currencies.enum"
import { UserDto } from "./user.dto"

export type PsychologistDto = {
  _id: string
  user: UserDto
  currency: CURRENCIES
  sessionDurations: []
  education: []
  isInTheClub: boolean
  clients: []
}
