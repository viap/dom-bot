import { getPsychologistTherapyRequests } from "../../../api/controllerTherapyRequests/getPsychologistTherapyRequests"
import { PropType } from "../../../api/type/propType"
import { TherapyRequestDto } from "../../../common/dto/therapyRequest.dto"
import { MyContext } from "../../../common/types/myContext"
import { ObjectWithPrimitiveValues } from "../../../common/types/objectWithPrimitiveValues"
import { getCurrentDateString } from "../../../common/utils/getCurrentDateString"
import { getCurrentTimeString } from "../../../common/utils/getCurrentTimeString"
import { getTextOfContactsData } from "../../../common/utils/getTextOfContactsData"
import { getTextOfData } from "../../../common/utils/getTextOfData"
import { notEmpty } from "../../../common/utils/notEmpty"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"
import MenuBlock from "../menuBlock"
import {
  MenuBlockItemsProps,
  PartialMenuBlockItemsProps,
} from "../types/menuBlockItemsProps.type"

export async function loadPsychologistTherapyRequestsMenuItems(
  ctx: MyContext,
  props: PropType<MenuBlockItemsProps, "props"> = []
): Promise<Array<PartialMenuBlockItemsProps>> {
  const [params] = props as [ObjectWithPrimitiveValues]
  const therapyRequests = await getPsychologistTherapyRequests(ctx, params)

  const menuItems: Array<PartialMenuBlockItemsProps> = therapyRequests
    .reverse()
    .map((therapyRequest) =>
      getPsychologistTherapyRequestMenuItem(therapyRequest)
    )

  return menuItems
}

export function getPsychologistTherapyRequestMenuItem(
  therapyRequest: TherapyRequestDto
): PartialMenuBlockItemsProps {
  const props = [therapyRequest]

  const requestDate = getCurrentDateString(therapyRequest.timestamp)
  const requestTime = getCurrentTimeString(therapyRequest.timestamp)

  const content: string = [
    getTextOfData(
      "",
      {
        dateTime: `${requestDate} в ${requestTime}`,
        name: therapyRequest.name,
        descr: therapyRequest.descr,
        psychologist: therapyRequest.psychologist
          ? therapyRequest.psychologist.user.name
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
    name: `Заявка от ${requestDate} в ${requestTime}`,
    content,
    props,
  })

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
