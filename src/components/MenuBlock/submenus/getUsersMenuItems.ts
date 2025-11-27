import { getAllUsers } from "@/api/controllerUsers/getAllUsers"
import { PropType } from "@/api/type/propType"
import { ROLES_DESCR } from "@/common/consts/rolesDescr"
import { UserDto } from "@/common/dto/user.dto"
import { ROLES } from "@/common/enums/roles"
import { MyContext } from "@/common/types/myContext"
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

export async function loadUsersMenuItems(
  ctx: MyContext,
  parent: MenuBlockItemsProps,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _props: PropType<MenuBlockItemsProps, "props"> = []
): Promise<Array<PartialMenuBlockItemsProps>> {
  return (await getAllUsers(ctx))
    .reverse()
    .map((user) => getUserMenuItem(parent, user))
}

export function getUserMenuItem(
  parent: MenuBlockItemsProps,
  user: UserDto
): PartialMenuBlockItemsProps {
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
    .join(ReplyMarkup.doubleNewLine)

  const result: PartialMenuBlockItemsProps = MenuBlock.getPreparedMenu(
    {
      name: user.name,
      content,
      props,
    },
    parent
  )

  const rolesList = Object.values(ROLES).filter((roleName) => {
    return roleName != ROLES.USER && roleName != ROLES.PSYCHOLOGIST
  })

  const editRoleItems = rolesList.map((roleName) => {
    return !user.roles.includes(roleName)
      ? {
          name: `Добавить роль "${ROLES_DESCR.get(roleName) || roleName}"`,
          conversation: CONVERSATION_NAMES.USER_ADD_ROLE,
          props: [...props, roleName],
          roles: [ROLES.ADMIN],
        }
      : {
          name: `Удалить роль "${ROLES_DESCR.get(roleName) || roleName}"`,
          conversation: CONVERSATION_NAMES.USER_REMOVE_ROLE,
          props: [...props, roleName],
          roles: [ROLES.ADMIN],
        }
  })

  result.items = [
    {
      name: "Редактировать",
      conversation: CONVERSATION_NAMES.USER_EDIT,
      props,
    },
    !user.roles.includes(ROLES.PSYCHOLOGIST)
      ? {
          name: `Добавить роль "${
            ROLES_DESCR.get(ROLES.PSYCHOLOGIST) || ROLES.PSYCHOLOGIST
          }"`,
          conversation: CONVERSATION_NAMES.USER_TO_PSYCHOLOGIST,
          roles: [ROLES.ADMIN],
          props,
        }
      : {
          name: `Удалить роль "${
            ROLES_DESCR.get(ROLES.PSYCHOLOGIST) || ROLES.PSYCHOLOGIST
          }"`,
          conversation: CONVERSATION_NAMES.USER_REMOVE_ROLE,
          roles: [ROLES.ADMIN],
          props: [...props, ROLES.PSYCHOLOGIST],
        },
    ...editRoleItems,
  ].filter(notEmpty) as Array<PartialMenuBlockItemsProps>

  return result
}
