import { getPsychologistClients } from "../../../api/controllerPsychologists/getPsychologistClients"
import { getTherapySessions } from "../../../api/controllerTherapySessions/getTherapySessions"
import { PropType } from "../../../api/type/propType"
import { ClientDto } from "../../../common/dto/client.dto"
import { TherapySessionDto } from "../../../common/dto/therapySession.dto"
import { MyContext } from "../../../common/types/myContext"
import { getTextOfContactsData } from "../../../common/utils/getTextOfContactsData"
import { getTextOfData } from "../../../common/utils/getTextOfData"
import { groupBy } from "../../../common/utils/groupBy"
import { notEmpty } from "../../../common/utils/notEmpty"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames"
import { SUBMENU_TYPES } from "../enums/submenuTypes"
import MenuBlock from "../menuBlock"
import {
  MenuBlockItemsProps,
  PartialMenuBlockItemsProps,
} from "../types/menuBlockItemsProps"

export async function loadClientsMenuItems(
  ctx: MyContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _props: PropType<MenuBlockItemsProps, "props">
): Promise<Array<PartialMenuBlockItemsProps>> {
  const therapySessionsByClient = groupBy<TherapySessionDto>(
    await getTherapySessions(ctx),
    (ts: TherapySessionDto) => ts.client?._id
  )

  return (await getPsychologistClients(ctx))
    .reverse()
    .map((client) =>
      getClientMenuItem(client, therapySessionsByClient[client.user._id])
    )
}

export function getClientMenuItem(
  client: ClientDto,
  sessions: Array<TherapySessionDto> = []
): PartialMenuBlockItemsProps {
  const props = [client, sessions]

  const content: string = [
    getTextOfData(
      "",
      {
        name: client.user.name,
        therapyRequest:
          client.therapyRequest && client.therapyRequest.descr
            ? client.therapyRequest.descr
            : undefined,
        descr: client.descr,
        sessionsCount: sessions.length,
      },
      {
        name: "имя",
        descr: "описание",
        therapyRequest: "запрос",
        sessionsCount: "количество сессий",
      }
    ),
    getTextOfContactsData(client.user.contacts),
  ]
    .filter(notEmpty)
    .join("\r\n\r\n")

  const result: PartialMenuBlockItemsProps = MenuBlock.getPreparedMenu({
    name: `${client.user.name} | ${sessions.length} (${Math.round(
      sessions.reduce((acc, session) => {
        return acc + session.duration
      }, 0) / 60
    )} ч.)`,
    content,
    props,
  })

  result.items = [
    sessions.length > 0
      ? {
          name: "Список сессий",
          submenu: SUBMENU_TYPES.PSYCHOLOGIST_CLIENT_THERAPY_SESSIONS,
          options: {
            columns: 2,
          },
          props,
        }
      : undefined,
    {
      name: "Добавить сессию",
      conversation: CONVERSATION_NAMES.THERAPY_SESSION_ADD,
      props,
    },
    {
      name: "Редактировать описание",
      conversation: CONVERSATION_NAMES.CLIENT_EDIT,
      props,
    },
    sessions.length === 0
      ? {
          name: "Удалить",
          conversation: CONVERSATION_NAMES.CLIENT_DELETE,
          props,
        }
      : undefined,
  ].filter(notEmpty) as Array<PartialMenuBlockItemsProps>

  return result
}
