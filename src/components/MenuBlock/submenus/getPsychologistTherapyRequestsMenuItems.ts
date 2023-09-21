import { getPsychologistTherapyRequests } from "../../../api/controllerTherapyRequests/getPsychologistTherapyRequests"
import { TherapyRequestDto } from "../../../common/dto/therapyRequest.dto"
import { MyContext } from "../../../common/types/myContext"
import { getCurrentDateString } from "../../../common/utils/getCurrentDateString"
import { getCurrentTimeString } from "../../../common/utils/getCurrentTimeString"
import { getTextOfContactsData } from "../../../common/utils/getTextOfContactsData"
import { getTextOfData } from "../../../common/utils/getTextOfData"
import { notEmpty } from "../../../common/utils/notEmpty"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"
import MenuBlock from "../menuBlock"
import { MenuBlockItemsProps } from "../types/menuBlockItemsProps.type"

export async function loadPsychologistTherapyRequestsMenuItems(
  ctx: MyContext,
  current: MenuBlockItemsProps
): Promise<Array<MenuBlockItemsProps>> {
  const therapyRequests = await getPsychologistTherapyRequests(ctx)

  const menuItems: Array<MenuBlockItemsProps> = therapyRequests
    .reverse()
    .filter((therapyRequest) => !therapyRequest.accepted)
    .map((therapyRequest) =>
      getPsychologistTherapyRequestMenuItem(current, therapyRequest)
    )

  return menuItems
}

export function getPsychologistTherapyRequestMenuItem(
  parent: MenuBlockItemsProps,
  therapyRequest: TherapyRequestDto
): MenuBlockItemsProps {
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

  const result = MenuBlock.getPreparedMenu(
    {
      name: `Заявка от ${requestDate} в ${requestTime}`,
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
        }
      : undefined,
    !therapyRequest.accepted
      ? {
          name: "Отклонить заявку",
          conversation: CONVERSATION_NAMES.THERAPY_REQUEST_REJECT,
        }
      : undefined,
  ]
    .filter(notEmpty)
    .map((item) => {
      return MenuBlock.getPreparedMenu({ ...item, props }, result)
    }) as Array<MenuBlockItemsProps>

  return result
}
