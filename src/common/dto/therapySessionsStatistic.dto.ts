import { PriceDto } from "./price.dto"
import { PsychologistDto } from "./psychologist.dto"
import { UserDto } from "./user.dto"

export type TherapySessionsStatisticDto = {
  client: UserDto
  psychologist: PsychologistDto

  from: string
  to: string

  price: Array<PriceDto>
  comission: Array<PriceDto>

  countForPeriod: number
  countAll: number
}
