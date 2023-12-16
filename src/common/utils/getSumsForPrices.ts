import { PriceDto } from "../dto/price.dto"
import { groupBy } from "./groupBy"

export function getSumsForPrices(prices: Array<PriceDto>) {
  return Object.entries(groupBy(prices, (price) => price.currency)).map(
    ([currency, prices]) =>
      `${prices
        .map((price) => price.value)
        .reduce((sum, value) => sum + value, 0)} ${currency}`
  )
}
