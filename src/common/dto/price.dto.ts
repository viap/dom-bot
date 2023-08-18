import { CURRENCIES } from "../enums/currencies.enum"

export type PriceDto = {
  currency: CURRENCIES
  value: number
}
