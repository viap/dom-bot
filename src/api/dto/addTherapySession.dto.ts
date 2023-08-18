import { PriceDto } from "../../common/dto/price.dto"

export type AddTherapySessionDto = {
  date: string
  psychologist: string
  client: string
  duration: number
  price: PriceDto
  comission: PriceDto
  descr?: string
}
