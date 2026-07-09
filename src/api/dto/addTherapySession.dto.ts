import { PriceDto } from "@/common/dto/price.dto"

export type AddTherapySessionDto = {
  dateTime: number
  psychologist: string
  client: string
  therapyRequest?: string
  duration: number
  price: PriceDto
  commission?: PriceDto
  descr?: string
}
