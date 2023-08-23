import { getPsychologistClients } from "../../../api/controllerPsychologists/getPsychologistClients"
import { getTherapySessions } from "../../../api/controllerTherapySessions/getTherapySessions"
import { ClientDto } from "../../../common/dto/client.dto"
import { TherapySessionDto } from "../../../common/dto/therapySession.dto"
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
        current,
        client,
        therapySessionsByClient[client.user._id]
      )
    )

  return menuItems
}

export function getClientMenuItem(
  parent: MenuBlockItemsProps,
  client: ClientDto,
  sessions: Array<TherapySessionDto> = []
): MenuBlockItemsProps {
  const props = [client, sessions]
  const result = {
    name: client.user.name + " | " + sessions.length,
    parent,
    roles: parent?.roles,
    content: getTextOfData(
      "Клиент",
      {
        name: client.user.name,
        descr: client.descr,
        sessionsCount: sessions.length,
      },
      { name: "Имя", descr: "Описание", sessionsCount: "Количество сессий" }
    ),
    props: props,
  } as MenuBlockItemsProps

  result.items = [
    sessions.length > 0
      ? {
          name: "Список сессий",
          conversation: CONVERSATION_NAMES.CLIENT_THERAPY_SESSIONS_LIST,
          submenu: SUBMENU_TYPES.PSYCHOLOGIST_CLIENT_THERAPY_SESSIONS,
          options: {
            columns: 2,
          },
        }
      : undefined,
    {
      name: "Добавить сессию",
      conversation: CONVERSATION_NAMES.THERAPY_SESSION_ADD,
    },
    {
      name: "Редактировать описание",
      conversation: CONVERSATION_NAMES.CLIENT_EDIT,
    },
    sessions.length === 0
      ? {
          name: "Удалить",
          conversation: CONVERSATION_NAMES.CLIENT_DELETE,
        }
      : undefined,
  ]
    .filter((item) => !!item)
    .map((item) => {
      return {
        ...item,
        parent: result,
        roles: result?.roles,
        props,
      }
    }) as Array<MenuBlockItemsProps>

  return result
}
