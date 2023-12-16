import { PERIODS } from "../enums/periods.enum"

export function getTimeRange(
  range: PERIODS,
  timestamp: number = Date.now()
): [Date, Date] {
  const curr = new Date(timestamp)

  const oneSecond = 1000
  const oneMinute = oneSecond * 60
  const oneDay = oneMinute * 60 * 24

  // NOTICE: difference between this date as evaluated in the UTC time zone, and the same date as evaluated in the local time zone.
  // offset value needed for correction
  const offset = curr.getTimezoneOffset() * oneMinute * -1

  let firstday: Date
  let lastday: Date

  switch (range) {
    case PERIODS.YEAR:
      firstday = new Date(curr.getUTCFullYear(), 0)
      lastday = new Date(
        new Date(curr.getUTCFullYear() + 1, 0).getTime() - oneSecond
      )
      break
    case PERIODS.MONTH:
      firstday = new Date(curr.getUTCFullYear(), curr.getUTCMonth())
      lastday = new Date(
        new Date(curr.getUTCFullYear(), curr.getUTCMonth() + 1).getTime() -
          oneSecond
      )
      break
    case PERIODS.HALF_MONTH:
      firstday = new Date(curr.getUTCFullYear(), curr.getUTCMonth())
      lastday = new Date(
        new Date(curr.getUTCFullYear(), curr.getUTCMonth(), 15).getTime() -
          oneSecond
      )
      break
    case PERIODS.FORTNIGHT:
      firstday = new Date(
        new Date(
          curr.getUTCFullYear(),
          curr.getUTCMonth(),
          curr.getUTCDate() - curr.getUTCDay() + 1
        ).getTime() -
          oneDay * 7
      )
      lastday = new Date(firstday.getTime() + (oneDay * 14 - oneSecond))
      break
    case PERIODS.WEEK:
      firstday = new Date(
        curr.getUTCFullYear(),
        curr.getUTCMonth(),
        curr.getUTCDate() - curr.getUTCDay() + 1
      )

      lastday = new Date(firstday.getTime() + (oneDay * 7 - oneSecond))
      break
  }

  return [
    new Date(firstday.getTime() + offset),
    new Date(lastday.getTime() + offset),
  ]
}
