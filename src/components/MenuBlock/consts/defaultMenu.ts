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
      name: "Клиенты",
      roles: [ROLES.PSYCHOLOGIST],
      items: [
        {
          name: "Список клиентов",
          submenu: SUBMENU_TYPES.CLIENTS,
          options: { columns: 2 },
        },
        {
          name: "Добавить клиента",
          conversation: CONVERSATION_NAMES.CLIENT_ADD,
          roles: [ROLES.PSYCHOLOGIST],
        },
      ],
    },
    {
      name: "Пользователи",
      submenu: SUBMENU_TYPES.USERS,
      options: { columns: 2 },
      roles: [ROLES.ADMIN, ROLES.EDITOR],
    },
    // {
    //   name: "Личный кабинет",
    //   roles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.PSYCHOLOGIST],
    // },
    {
      name: "Оставить заявку",
      content: "Опишите пожалуйста ваш запрос",
      conversation: CONVERSATION_NAMES.THERAPY_REQUEST_ADD,
    },
    {
      name: "О пространстве",
      content: "Описание пространства",
    },
  ],
}
