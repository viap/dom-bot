import { ROLES } from "../../../common/enums/roles.enum"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"
import { SUBMENU_TYPES } from "../enums/submenuTypes.enum"
import { MenuBlockItemsProps } from "../types/menuBlockItemsProps.type"
import { defaultRoles } from "./defaultRoles"

const defaultMenu = {
  name: "Меню",
  roles: defaultRoles,
  items: [
    // {
    //   name: "Расписание",
    //   content: "Расписание кабинетов DOM'а",
    // },
    // {
    //   name: "Забронировать кабинет",
    //   content: "Забронировать кабинет",
    // },
    // {
    //   name: "О пространстве",
    //   content: "Описание пространства",
    // },
    {
      name: "Пользователи",
      submenu: SUBMENU_TYPES.ALL_USERS,
      options: { columns: 2 },
      roles: [ROLES.ADMIN, ROLES.EDITOR],
    },
    {
      name: "Заявки",
      roles: [ROLES.ADMIN, ROLES.EDITOR],
      items: [
        {
          name: "Список заявок",
          options: { columns: 2 },
          submenu: SUBMENU_TYPES.ALL_THERAPY_REQUESTS,
        },
      ],
    },
    {
      name: "Мои клиенты",
      roles: [ROLES.PSYCHOLOGIST],
      items: [
        {
          name: "Список клиентов",
          submenu: SUBMENU_TYPES.PSYCHOLOGIST_CLIENTS,
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
      name: "Мои заявки",
      roles: [ROLES.PSYCHOLOGIST],
      submenu: SUBMENU_TYPES.PSYCHOLOGIST_THERAPY_REQUESTS,
      options: {
        columns: 2,
      },
    },
    {
      name: "Оставить заявку",
      content: "Опишите пожалуйста ваш запрос",
      conversation: CONVERSATION_NAMES.THERAPY_REQUEST_ADD,
    },
  ],
} as Partial<MenuBlockItemsProps>

export default defaultMenu
