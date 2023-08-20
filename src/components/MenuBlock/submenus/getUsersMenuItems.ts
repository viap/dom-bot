import { getAllUsers } from "../../../api/getAllUsers"
import { UserDto } from "../../../common/dto/user.dto"
import { ROLES } from "../../../common/enums/roles.enum"
import { MyContext } from "../../../common/types/myContext"
import { getTextOfData } from "../../../common/utils/getTextOfData"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"
import { MenuBlockItemsProps } from "../types/menuBlockItemsProps.type"

export async function loadUsersMenuItems(
  ctx: MyContext,
  current: MenuBlockItemsProps
): Promise<Array<MenuBlockItemsProps>> {
  const menuItems: Array<MenuBlockItemsProps> = (await getAllUsers(ctx))
    .reverse()
    .map((user) => getUserMenuItem(current, user))

  return menuItems
}

export function getUserMenuItem(
  parent: MenuBlockItemsProps,
  user: UserDto
): MenuBlockItemsProps {
  const props = [user]
  const result = {
    name: user.name,
    parent,
    roles: parent?.roles,
    content: getTextOfData(
      "Пользователь",
      {
        name: user.name,
        descr: user.descr || "",
        roles: user.roles.join(", "),
      },
      { name: "имя", descr: "описание", roles: "права" }
    ),
    props: props,
  } as MenuBlockItemsProps

  result.items = [
    {
      name: "Редактировать",
      conversation: CONVERSATION_NAMES.USER_EDIT,
    },
    !user.roles.includes(ROLES.PSYCHOLOGIST)
      ? {
          name: "Дать права психолога",
          conversation: CONVERSATION_NAMES.USER_TO_PSYCHOLOGIST,
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
