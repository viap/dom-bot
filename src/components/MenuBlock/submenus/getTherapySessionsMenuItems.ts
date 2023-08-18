import { ClientDto } from "../../../common/dto/client.dto"
import { TherapySessionDto } from "../../../common/dto/therapySession.dto"
import { ROLES } from "../../../common/enums/roles.enum"
import { MyContext } from "../../../common/types/myContext"
import { getTextOfData } from "../../../common/utils/getTextOfData"
import { oneDayInMilliseconds } from "../../../common/consts/oneDayInMilliseconds"
import { MenuBlockItemsProps } from "../types/menuBlockItemsProps.type"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"

export async function loadTherapySessionsMenuItems(
  ctx: MyContext,
  current: MenuBlockItemsProps,
  conversationProps: [ClientDto, TherapySessionDto[]]
): Promise<Array<MenuBlockItemsProps>> {
  const [client, sessions] = conversationProps
  const menuItems: Array<MenuBlockItemsProps> = [...(sessions || [])]
    .reverse()
    .map((session, index) =>
      getTherapySessionMenuItem(
        client,
        session,
        sessions.length - index,
        current.roles
      )
    )

  return menuItems
}

export function getTherapySessionMenuItem(
  client: ClientDto,
  session: TherapySessionDto,
  index: number,
  roles?: Array<ROLES>
): MenuBlockItemsProps {
  const conversationProps = [client, session]

  const deletionIsAvailable =
    Date.now() - session.timestamp < oneDayInMilliseconds
  return {
    name: "Сессия №" + index,
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
    roles,
    items: [
      deletionIsAvailable
        ? {
            name: "Удалить сессию",
            conversationProps,
            conversation: CONVERSATION_NAMES.DELETE_THERAPY_SESSION,
          }
        : undefined,
    ].filter((item) => !!item),
    conversationProps,
  } as MenuBlockItemsProps
}
