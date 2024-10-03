import { SocialNetworks } from "../../../common/enums/socialNetworks"
import { getAllTherapyRequests } from "../../../api/controllerTherapyRequests/getAllTherapyRequests"
import { PropType } from "../../../api/type/propType"
import { TherapyRequestDto } from "../../../common/dto/therapyRequest.dto"
import { MyContext } from "../../../common/types/myContext"
import { ObjectWithPrimitiveValues } from "../../../common/types/objectWithPrimitiveValues"
import { getLocalDateString } from "../../../common/utils/getLocalDateString"
import { getLocalTimeString } from "../../../common/utils/getLocalTimeString"
import { getTextOfContactsData } from "../../../common/utils/getTextOfContactsData"
import { getTextOfData } from "../../../common/utils/getTextOfData"
import { notEmpty } from "../../../common/utils/notEmpty"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames"
import MenuBlock from "../menuBlock"
import {
  MenuBlockItemsProps,
  PartialMenuBlockItemsProps,
} from "../types/menuBlockItemsProps"
import { ReplyMarkup } from "../../../common/utils/replyMarkup"

export async function loadTherapyRequestsMenuItems(
  ctx: MyContext,
  parent: MenuBlockItemsProps,
  props: PropType<MenuBlockItemsProps, "props"> = []
): Promise<Array<PartialMenuBlockItemsProps>> {
  const [params] = props as [ObjectWithPrimitiveValues]
  const therapyRequests = await getAllTherapyRequests(ctx, params)

  return therapyRequests
    .reverse()
    .map((therapyRequest) => getTherapyRequestMenuItem(parent, therapyRequest))
}

export function getTherapyRequestMenuItem(
  parent: MenuBlockItemsProps,
  therapyRequest: TherapyRequestDto
): PartialMenuBlockItemsProps {
  const props = [therapyRequest]

  const requestDate = getLocalDateString(therapyRequest.timestamp)
  const requestTime = getLocalTimeString(therapyRequest.timestamp)

  const psychologistTelegramUserName =
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
          ? [
              psychologistTelegramUserName,
              therapyRequest.psychologist.user.name,
            ]
              .filter(notEmpty)
              .join(", ")
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
    .join(ReplyMarkup.doubleNewLine)

  const result: PartialMenuBlockItemsProps = MenuBlock.getPreparedMenu(
    {
      name: `${therapyRequest.name}, заявка от ${requestDate}`,
      content,
      props,
    },
    parent
  )

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
