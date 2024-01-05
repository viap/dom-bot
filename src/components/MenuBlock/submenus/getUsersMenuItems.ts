import { getAllUsers } from "../../../api/controllerUsers/getAllUsers"
import { PropType } from "../../../api/type/propType"
import { UserDto } from "../../../common/dto/user.dto"
import { ROLES } from "../../../common/enums/roles.enum"
import { MyContext } from "../../../common/types/myContext"
import { getTextOfContactsData } from "../../../common/utils/getTextOfContactsData"
import { getTextOfData } from "../../../common/utils/getTextOfData"
import { notEmpty } from "../../../common/utils/notEmpty"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames"
import MenuBlock from "../menuBlock"
import {
  MenuBlockItemsProps,
  PartialMenuBlockItemsProps,
} from "../types/menuBlockItemsProps.type"

export async function loadUsersMenuItems(
  ctx: MyContext,
  _props: PropType<MenuBlockItemsProps, "props"> = []
): Promise<Array<PartialMenuBlockItemsProps>> {
  return (await getAllUsers(ctx)).reverse().map((user) => getUserMenuItem(user))
}

export function getUserMenuItem(user: UserDto): PartialMenuBlockItemsProps {
  const props = [user]

  const content: string = [
    getTextOfData(
      "Пользователь",
      {
        name: user.name,
        descr: user.descr || "",
        roles: user.roles.join(", "),
      },
      { name: "имя", descr: "описание", roles: "права" }
    ),
    getTextOfContactsData(user.contacts),
  ]
    .filter(notEmpty)
    .join("\r\n\r\n")

  const result: PartialMenuBlockItemsProps = MenuBlock.getPreparedMenu({
    name: user.name,
    content,
    props,
  })

  result.items = [
    {
      name: "Редактировать",
      conversation: CONVERSATION_NAMES.USER_EDIT,
      props,
    },
    !user.roles.includes(ROLES.PSYCHOLOGIST)
      ? {
          name: "Дать права психолога",
          conversation: CONVERSATION_NAMES.USER_TO_PSYCHOLOGIST,
          props,
        }
      : {
          name: "Убрать права психолога",
          conversation: CONVERSATION_NAMES.PSYCHOLOGIST_TO_USER,
          props,
        },
  ].filter(notEmpty) as Array<PartialMenuBlockItemsProps>

  return result
}
