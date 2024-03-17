import { PriceDto } from "../../common/dto/price.dto"

export type AddTherapySessionDto = {
  dateTime: number
  psychologist: string
  client: string
  duration: number
  price: PriceDto
  comission: PriceDto
  descr?: string
}
