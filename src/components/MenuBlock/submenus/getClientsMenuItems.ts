import { getPsychologistClients } from "../../../api/getPsychologistClients"
import { getTherapySessions } from "../../../api/getTherapySessions"
import { ClientDto } from "../../../common/dto/client.dto"
import { TherapySessionDto } from "../../../common/dto/therapySession.dto"
import { ROLES } from "../../../common/enums/roles.enum"
import { MyContext } from "../../../common/types/myContext"
import { getTextOfData } from "../../../common/utils/getTextOfData"
import { groupBy } from "../../../common/utils/groupBy"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"
import { SUBMENU_TYPES } from "../enums/submenuTypes.enum"
import { MenuBlockItemsProps } from "../types/menuBlockItemsProps.type"

export async function loadClientsMenuItems(
  ctx: MyContext,
  current: MenuBlockItemsProps
): Promise<Array<MenuBlockItemsProps>> {
  const therapySessionsByClient = groupBy<TherapySessionDto>(
    await getTherapySessions(ctx),
    (ts: TherapySessionDto) => ts.client._id
  )
  const menuItems: Array<MenuBlockItemsProps> = (
    await getPsychologistClients(ctx)
  )
    .reverse()
    .map((client) =>
      getClientMenuItem(
        client,
        therapySessionsByClient[client.user._id],
        current.roles
      )
    )

  return menuItems
}

export function getClientMenuItem(
  client: ClientDto,
  sessions: Array<TherapySessionDto> = [],
  roles?: Array<ROLES>
): MenuBlockItemsProps {
  const conversationProps = [client, sessions]
  const result = {
    name: client.user.name + " | " + sessions.length,
    // content: (clientData: ClientDto) => {
    //   return getTextOfData(
    //     "Клиент",
    //     { name: clientData.user.name, descr: clientData.descr },
    //     { name: "Имя", descr: "Описание" }
    //   )
    // },
    content: getTextOfData(
      "Клиент",
      {
        name: client.user.name,
        descr: client.descr,
        sessionsCount: sessions.length,
      },
      { name: "Имя", descr: "Описание", sessionsCount: "Количество сессий" }
    ),
    items: [
      {
        name: "Добавить сессию",
        conversationProps,
        conversation: CONVERSATION_NAMES.THERAPY_SESSION_ADD,
      },
      sessions.length > 0
        ? {
            name: "Список сессий",
            conversationProps,
            conversation: CONVERSATION_NAMES.CLIENT_THERAPY_SESSIONS_LIST,
            submenu: SUBMENU_TYPES.THERAPY_SESSIONS,
            options: {
              columns: 2,
            },
          }
        : undefined,
      {
        name: "Редактировать описание",
        conversationProps,
        conversation: CONVERSATION_NAMES.CLIENT_EDIT,
      },
      sessions.length === 0
        ? {
            name: "Удалить",
            conversationProps,
            conversation: CONVERSATION_NAMES.CLIENT_DELETE,
          }
        : undefined,
    ].filter((item) => !!item),
    conversationProps,
  } as MenuBlockItemsProps

  if (roles) {
    result.roles = roles
  }

  return result
}
