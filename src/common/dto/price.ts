import { CURRENCIES } from "../enums/currencies"

export type PriceDto = {
  currency: CURRENCIES
  value: number
}
