import { CURRENCIES } from "@/common/enums/currencies"

export type PriceDto = {
  currency: CURRENCIES
  value: number
}
