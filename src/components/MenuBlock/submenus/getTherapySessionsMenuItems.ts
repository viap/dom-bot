import { oneDayInMilliseconds } from "../../../common/consts/oneDayInMilliseconds"
import { ClientDto } from "../../../common/dto/client.dto"
import { TherapySessionDto } from "../../../common/dto/therapySession.dto"
import { MyContext } from "../../../common/types/myContext"
import { getTextOfData } from "../../../common/utils/getTextOfData"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"
import { MenuBlockItemsProps } from "../types/menuBlockItemsProps.type"

export async function loadTherapySessionsMenuItems(
  ctx: MyContext,
  current: MenuBlockItemsProps,
  props: [ClientDto, TherapySessionDto[]]
): Promise<Array<MenuBlockItemsProps>> {
  const [client, sessions] = props
  const menuItems: Array<MenuBlockItemsProps> = [...(sessions || [])]
    .reverse()
    .map((session) => getTherapySessionMenuItem(current, client, session))

  return menuItems
}

export function getTherapySessionMenuItem(
  parent: MenuBlockItemsProps,
  client: ClientDto,
  session: TherapySessionDto
): MenuBlockItemsProps {
  const props = [client, session]

  const deletionIsAvailable =
    Date.now() - session.timestamp < oneDayInMilliseconds

  const result = {
    name: `Сессия от ${session.date}`,
    parent,
    roles: parent?.roles,
    content: getTextOfData(
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
    ),
    props,
  } as MenuBlockItemsProps

  result.items = [
    deletionIsAvailable
      ? {
          name: "Удалить сессию",
          props,
          conversation: CONVERSATION_NAMES.THERAPY_SESSION_DELETE,
        }
      : undefined,
  ]
    .filter((item) => !!item)
    .map((item) => {
      return { ...item, parent: result, roles: result?.roles }
    }) as Array<MenuBlockItemsProps>

  return result
}
