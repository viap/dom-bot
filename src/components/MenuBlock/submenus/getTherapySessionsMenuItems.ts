import { PropType } from "../../../api/type/propType"
import { oneDayInMilliseconds } from "../../../common/consts/oneDayInMilliseconds"
import { ClientDto } from "../../../common/dto/client.dto"
import { TherapySessionDto } from "../../../common/dto/therapySession.dto"
import { MyContext } from "../../../common/types/myContext"
import { getTextOfData } from "../../../common/utils/getTextOfData"
import { notEmpty } from "../../../common/utils/notEmpty"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"
import MenuBlock from "../menuBlock"
import {
  MenuBlockItemsProps,
  PartialMenuBlockItemsProps,
} from "../types/menuBlockItemsProps.type"

export async function loadTherapySessionsMenuItems(
  _ctx: MyContext,
  props: PropType<MenuBlockItemsProps, "props"> = []
): Promise<Array<PartialMenuBlockItemsProps>> {
  const [client, sessions] = props as [ClientDto, TherapySessionDto[]]

  return [...(sessions || [])]
    .reverse()
    .map((session) => getTherapySessionMenuItem(client, session))
}

export function getTherapySessionMenuItem(
  client: ClientDto,
  session: TherapySessionDto
): PartialMenuBlockItemsProps {
  const props = [client, session]

  const content = getTextOfData(
    "",
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
    }
  )

  const result: PartialMenuBlockItemsProps = MenuBlock.getPreparedMenu({
    name: `Сессия от ${session.date}`,
    content,
    props,
  })

  const deletionIsAvailable =
    Date.now() - session.timestamp < oneDayInMilliseconds

  result.items = [
    deletionIsAvailable
      ? {
          name: "Удалить сессию",
          props,
          conversation: CONVERSATION_NAMES.THERAPY_SESSION_DELETE,
        }
      : undefined,
  ].filter(notEmpty) as Array<PartialMenuBlockItemsProps>

  return result
}
