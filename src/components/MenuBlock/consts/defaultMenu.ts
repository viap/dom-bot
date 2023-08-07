import { ROLES } from "../../../common/enums/roles.enum"
import { MenuBlockItemsProps } from "../types/menuBlockItemsProps.type"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"

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
