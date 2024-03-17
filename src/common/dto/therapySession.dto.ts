import { PriceDto } from "./price.dto"
import { PsychologistDto } from "./psychologist.dto"
import { UserDto } from "./user.dto"

export type TherapySessionDto = {
  _id: string

  date: string
  dateTime: number
  timestamp: number

  client: UserDto
  psychologist: PsychologistDto

  descr: string
  duration: number

  price: PriceDto
  comission: PriceDto
}
