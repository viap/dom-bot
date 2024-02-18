import { PERIODS } from "../enums/periods"

export function getTimeRange(
  range: PERIODS,
  timestamp: number = Date.now()
): [Date, Date] {
  const currLocal = new Date(timestamp)

  const oneSecond = 1000
  const oneMinute = oneSecond * 60
  const oneDay = oneMinute * 60 * 24

  // NOTICE: difference between this date as evaluated in the UTC time zone, and the same date as evaluated in the local time zone.
  // offset value needed for correction
  // const offset = currLocal.getTimezoneOffset() * oneMinute

  // NOTICE: Monday = 0, ... , Sunday = 6
  const utcDayNumber = currLocal.getUTCDay() > 0 ? currLocal.getUTCDay() : 6

  let firstday: Date
  let lastday: Date

  switch (range) {
    case PERIODS.YEAR:
      firstday = new Date(currLocal.getUTCFullYear(), 0)
      lastday = new Date(
        new Date(currLocal.getUTCFullYear() + 1, 0).getTime() - oneSecond
      )
      break
    case PERIODS.MONTH:
      firstday = new Date(currLocal.getUTCFullYear(), currLocal.getUTCMonth())
      lastday = new Date(
        new Date(
          currLocal.getUTCFullYear(),
          currLocal.getUTCMonth() + 1
        ).getTime() - oneSecond
      )
      break
    case PERIODS.HALF_MONTH:
      firstday = new Date(currLocal.getUTCFullYear(), currLocal.getUTCMonth())
      lastday = new Date(
        new Date(
          currLocal.getUTCFullYear(),
          currLocal.getUTCMonth(),
          15
        ).getTime() - oneSecond
      )
      break
    case PERIODS.FORTNIGHT:
      firstday = new Date(
        new Date(
          currLocal.getUTCFullYear(),
          currLocal.getUTCMonth(),
          currLocal.getUTCDate() - utcDayNumber
        ).getTime() -
          oneDay * 7
      )
      lastday = new Date(firstday.getTime() + (oneDay * 14 - oneSecond))
      break
    case PERIODS.WEEK:
      firstday = new Date(
        currLocal.getUTCFullYear(),
        currLocal.getUTCMonth(),
        currLocal.getUTCDate() - utcDayNumber
      )

      lastday = new Date(firstday.getTime() + (oneDay * 7 - oneSecond))
      break
  }

  return [new Date(firstday.getTime()), new Date(lastday.getTime())]
}
