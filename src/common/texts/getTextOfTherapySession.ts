import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { getTextOfData } from "../../common/utils/getTextOfData"

export function getTextOfTherapySession(
  session: TherapySessionDto,
  title = "",
  separator?: string
): string {
  return getTextOfData(
    title,
    {
      descr: session.descr,
      date: session.date,
      duration: session.duration,
      price: [session.price.value, session.price.currency].join(" "),
      comission: session.comission
        ? [session.comission.value, session.price.currency].join(" ")
        : "",
    },
    {
      descr: "описание",
      date: "дата",
      duration: "продолжительность",
      price: "цена",
      comission: "комиссия",
    },
    separator
  )
}
