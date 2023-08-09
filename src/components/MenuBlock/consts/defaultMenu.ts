import { ROLES } from "../../../common/enums/roles.enum"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"
import { MENU_DATA_TYPES } from "../enums/menuDataTypes.enum"
import { MenuBlockItemsProps } from "../types/menuBlockItemsProps.type"

export const DefaultMenu: MenuBlockItemsProps = {
  name: "Меню",
  descr: "Меню для Телеграма",
  roles: [ROLES.USER],
  items: [
    {
      name: "Расписание",
      descr: "Расписание кабинетов DOM'а",
      items: [],
    },
    {
      name: "Забронировать кабинет",
      descr: "Забронировать кабинет",
      items: [],
    },
    {
      name: "Личный кабинет",
      descr: "Личный кабинет члена команды DOM'a",
      roles: [ROLES.PSYCHOLOGIST],
      items: [
        {
          name: "Клиенты",
          descr: "",
          from: MENU_DATA_TYPES.CLIENTS,
          conversation: CONVERSATION_NAMES.CLIENT_DETAILS,
          options: { columns: 2 },
        },
        {
          name: "Добавить клиента",
          descr: "",
          items: [],
          conversation: CONVERSATION_NAMES.ADD_CLIENT,
        },
        {
          name: "Отметить сессию",
          descr: "",
          items: [],
          conversation: CONVERSATION_NAMES.MARK_SESSION,
        },
      ],
    },
    {
      name: "О пространстве",
      descr: "Описание",
      items: [],
    },
  ],
}
