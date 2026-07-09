import { PriceDto } from "./price.dto"
import { PsychologistDto } from "./psychologist.dto"
import { TherapyRequestDto } from "./therapyRequest.dto"
import { UserDto } from "./user.dto"

export type TherapySessionDto = {
  _id: string

  /** @deprecated No longer sent by the API. Use `dateTime` to derive a display date. */
  date?: string
  dateTime: number
  createdAt: string
  updatedAt: string

  client: UserDto
  psychologist: PsychologistDto
  therapyRequest?: TherapyRequestDto

  descr: string
  duration: number

  price: PriceDto
  commission: PriceDto
}
