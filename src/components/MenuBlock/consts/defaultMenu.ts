import { ROLES } from "../../../common/enums/roles.enum"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"
import { SUBMENU_TYPES } from "../enums/submenuTypes.enum"
import { MenuBlockItemsProps } from "../types/menuBlockItemsProps.type"
import { defaultRoles } from "./defaultRoles"

export const DefaultMenu: MenuBlockItemsProps = {
  name: "Меню",
  roles: defaultRoles,
  items: [
    {
      name: "Расписание",
      content: "Расписание кабинетов DOM'а",
    },
    {
      name: "Забронировать кабинет",
      content: "Забронировать кабинет",
    },
    {
      name: "Личный кабинет",
      roles: [ROLES.PSYCHOLOGIST],
      items: [
        {
          name: "Клиенты",
          submenu: SUBMENU_TYPES.CLIENTS,
          options: { columns: 2 },
        },
        {
          name: "Добавить клиента",
          conversation: CONVERSATION_NAMES.CLIENT_ADD,
        },
      ],
    },
    {
      name: "О пространстве",
      content: "Описание пространства",
    },
  ],
}
