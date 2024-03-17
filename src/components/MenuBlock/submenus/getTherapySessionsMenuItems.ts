import { getLocalDateString } from "../../../common/utils/getLocalDateString"
import { PropType } from "../../../api/type/propType"
import { ClientDto } from "../../../common/dto/client.dto"
import { TherapySessionDto } from "../../../common/dto/therapySession.dto"
import { MyContext } from "../../../common/types/myContext"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames"
import MenuBlock from "../menuBlock"
import {
  MenuBlockItemsProps,
  PartialMenuBlockItemsProps,
} from "../types/menuBlockItemsProps"

export async function loadTherapySessionsMenuItems(
  _ctx: MyContext,
  props: PropType<MenuBlockItemsProps, "props"> = []
): Promise<Array<PartialMenuBlockItemsProps>> {
  const [client, sessions] = props as [ClientDto, TherapySessionDto[]]

  return [...(sessions || [])]
    .sort((s1, s2) => s2.dateTime - s1.dateTime)
    .map((session) => getTherapySessionMenuItem(client, session))
}

export function getTherapySessionMenuItem(
  client: ClientDto,
  session: TherapySessionDto
): PartialMenuBlockItemsProps {
  const props = [client, session]

  const result: PartialMenuBlockItemsProps = MenuBlock.getPreparedMenu({
    name: `Сессия от ${getLocalDateString(session.dateTime)}`,
    conversation: CONVERSATION_NAMES.THERAPY_SESSION_SHOW,
    props,
  })

  return result
}
