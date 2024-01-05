import { SocialNetworks } from "../../../common/enums/socialNetworks"
import { getAllTherapyRequests } from "../../../api/controllerTherapyRequests/getAllTherapyRequests"
import { PropType } from "../../../api/type/propType"
import { TherapyRequestDto } from "../../../common/dto/therapyRequest.dto"
import { MyContext } from "../../../common/types/myContext"
import { ObjectWithPrimitiveValues } from "../../../common/types/objectWithPrimitiveValues"
import { getCurrentDateString } from "../../../common/utils/getCurrentDateString"
import { getCurrentTimeString } from "../../../common/utils/getCurrentTimeString"
import { getTextOfContactsData } from "../../../common/utils/getTextOfContactsData"
import { getTextOfData } from "../../../common/utils/getTextOfData"
import { notEmpty } from "../../../common/utils/notEmpty"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames"
import MenuBlock from "../menuBlock"
import {
  MenuBlockItemsProps,
  PartialMenuBlockItemsProps,
} from "../types/menuBlockItemsProps"

export async function loadTherapyRequestsMenuItems(
  ctx: MyContext,
  props: PropType<MenuBlockItemsProps, "props"> = []
): Promise<Array<PartialMenuBlockItemsProps>> {
  const [params] = props as [ObjectWithPrimitiveValues]
  const therapyRequests = await getAllTherapyRequests(ctx, params)

  return therapyRequests
    .reverse()
    .map((therapyRequest) => getTherapyRequestMenuItem(therapyRequest))
}

export function getTherapyRequestMenuItem(
  therapyRequest: TherapyRequestDto
): PartialMenuBlockItemsProps {
  const props = [therapyRequest]

  const requestDate = getCurrentDateString(therapyRequest.timestamp)
  const requestTime = getCurrentTimeString(therapyRequest.timestamp)

  const telegramUserName =
    therapyRequest.psychologist?.user.contacts.find(
      (contact) => contact.network === SocialNetworks.Telegram
    )?.username || ""
  const content: string = [
    getTextOfData(
      "",
      {
        dateTime: `${requestDate} в ${requestTime}`,
        name: therapyRequest.name,
        descr: therapyRequest.descr,
        psychologist: therapyRequest.psychologist
          ? (telegramUserName ? `@${telegramUserName}, ` : undefined) +
            therapyRequest.psychologist.user.name
          : "",
        accepted: therapyRequest.accepted ? "да" : "нет",
      },
      {
        dateTime: "дата и время",
        name: "имя",
        descr: "запрос",
        psychologist: "психолог",
        accepted: "принята",
      }
    ),
    getTextOfContactsData(therapyRequest.contacts),
  ]
    .filter(notEmpty)
    .join("\r\n\r\n")

  const result: PartialMenuBlockItemsProps = MenuBlock.getPreparedMenu({
    name: `${therapyRequest.name}, заявка от ${requestDate}`,
    content,
    props,
  })

  result.items = [
    !therapyRequest.accepted
      ? {
          name: "Перенаправить заявку",
          conversation: CONVERSATION_NAMES.THERAPY_REQUEST_TRANSFER,
          props,
        }
      : undefined,
    !therapyRequest.accepted
      ? {
          name: "Редактировать заявку",
          conversation: CONVERSATION_NAMES.THERAPY_REQUEST_EDIT,
          props,
        }
      : undefined,
    !therapyRequest.accepted
      ? {
          name: "Удалить заявку",
          conversation: CONVERSATION_NAMES.THERAPY_REQUEST_DELETE,
          props,
        }
      : undefined,
  ].filter(notEmpty) as Array<PartialMenuBlockItemsProps>

  return result
}
