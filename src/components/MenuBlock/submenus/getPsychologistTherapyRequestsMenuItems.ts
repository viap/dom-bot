import { getPsychologistTherapyRequests } from "@/api/controllerTherapyRequests/getPsychologistTherapyRequests"
import { PropType } from "@/api/type/propType"
import { TherapyRequestDto } from "@/common/dto/therapyRequest.dto"
import { MyContext } from "@/common/types/myContext"
import { ObjectWithPrimitiveValues } from "@/common/types/objectWithPrimitiveValues"
import { getLocalDateString } from "@/common/utils/getLocalDateString"
import { getLocalTimeString } from "@/common/utils/getLocalTimeString"
import { getTextOfContactsData } from "@/common/utils/getTextOfContactsData"
import { getTextOfData } from "@/common/utils/getTextOfData"
import { notEmpty } from "@/common/utils/notEmpty"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "@/conversations/enums/conversationNames"
import MenuBlock from "../menuBlock"
import {
  MenuBlockItemsProps,
  PartialMenuBlockItemsProps,
} from "../types/menuBlockItemsProps"

export async function loadPsychologistTherapyRequestsMenuItems(
  ctx: MyContext,
  parent: MenuBlockItemsProps,
  props: PropType<MenuBlockItemsProps, "props"> = []
): Promise<Array<PartialMenuBlockItemsProps>> {
  const [params] = props as [ObjectWithPrimitiveValues]
  const therapyRequests = await getPsychologistTherapyRequests(ctx, params)

  const menuItems: Array<PartialMenuBlockItemsProps> = therapyRequests
    .reverse()
    .map((therapyRequest) =>
      getPsychologistTherapyRequestMenuItem(parent, therapyRequest)
    )

  return menuItems
}

export function getPsychologistTherapyRequestMenuItem(
  parent: MenuBlockItemsProps,
  therapyRequest: TherapyRequestDto
): PartialMenuBlockItemsProps {
  const props = [therapyRequest]

  const requestDate = getLocalDateString(therapyRequest.timestamp)
  const requestTime = getLocalTimeString(therapyRequest.timestamp)

  const content: string = [
    getTextOfData(
      "",
      {
        dateTime: `${requestDate} в ${requestTime}`,
        name: therapyRequest.name,
        descr: therapyRequest.descr,
        psychologist: therapyRequest.psychologist?.user.name || "",
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
          name: "Принять заявку",
          conversation: CONVERSATION_NAMES.THERAPY_REQUEST_ACCEPT,
          props,
        }
      : undefined,
    !therapyRequest.accepted
      ? {
          name: "Отклонить заявку",
          conversation: CONVERSATION_NAMES.THERAPY_REQUEST_REJECT,
          props,
        }
      : undefined,
    !therapyRequest.accepted
      ? {
          name: "Перенаправить заявку",
          conversation: CONVERSATION_NAMES.THERAPY_REQUEST_TRANSFER,
          props,
        }
      : undefined,
  ].filter(notEmpty) as Array<PartialMenuBlockItemsProps>

  return result
}
