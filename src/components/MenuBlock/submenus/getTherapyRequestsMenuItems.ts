import { notEmpty } from "../../../common/utils/notEmpty"
import { getAllTherapyRequests } from "../../../api/controllerTherapyRequests/getAllTherapyRequests"
import { TherapyRequestDto } from "../../../common/dto/therapyRequest.dto"
import { MyContext } from "../../../common/types/myContext"
import { getCurrentDateString } from "../../../common/utils/getCurrentDateString"
import { getCurrentTimeString } from "../../../common/utils/getCurrentTimeString"
import { getTextOfData } from "../../../common/utils/getTextOfData"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"
import { MenuBlockItemsProps } from "../types/menuBlockItemsProps.type"
import { getTextOfContactsData } from "../../../common/utils/getTextOfContactsData"
import MenuBlock from "../menuBlock"

export async function loadTherapyRequestsMenuItems(
  ctx: MyContext,
  current: MenuBlockItemsProps
): Promise<Array<MenuBlockItemsProps>> {
  const therapyRequests = await getAllTherapyRequests(ctx)

  const menuItems: Array<MenuBlockItemsProps> = therapyRequests
    .reverse()
    .map((therapyRequest) => getTherapyRequestMenuItem(current, therapyRequest))

  return menuItems
}

export function getTherapyRequestMenuItem(
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
          name: "Перенаправить заявку",
          conversation: CONVERSATION_NAMES.THERAPY_REQUEST_TRANSFER,
        }
      : undefined,
    !therapyRequest.accepted
      ? {
          name: "Редактировать заявку",
          conversation: CONVERSATION_NAMES.THERAPY_REQUEST_EDIT,
        }
      : undefined,
    !therapyRequest.accepted
      ? {
          name: "Удалить заявку",
          conversation: CONVERSATION_NAMES.THERAPY_REQUEST_DELETE,
        }
      : undefined,
  ]
    .filter(notEmpty)
    .map((item) => {
      return MenuBlock.getPreparedMenu({ ...item, props }, result)
    }) as Array<MenuBlockItemsProps>

  return result
}
