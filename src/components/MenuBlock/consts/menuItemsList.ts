import { ROLES } from "../../../common/enums/roles.enum"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames.enum"
import MENU_ITEM_TYPES from "../enums/menuItemTypes.enum"
import { SUBMENU_TYPES } from "../enums/submenuTypes.enum"
import { PartialMenuBlockItemsProps } from "../types/menuBlockItemsProps.type"
import { defaultRoles } from "./defaultRoles"

const menuItemsList: Array<
  PartialMenuBlockItemsProps & Required<{ key: string }>
> = [
  {
    key: MENU_ITEM_TYPES.MAIN,
    name: "Меню",
    roles: defaultRoles,
  },
  {
    key: MENU_ITEM_TYPES.ABOUT,
    name: "О нас",
    content: "Описание пространства",
  },
  {
    key: MENU_ITEM_TYPES.SCHEDULE,
    name: "Расписание",
    content: "Расписание кабинетов DOM'а",
  },
  {
    key: MENU_ITEM_TYPES.BOOK,
    name: "Забронировать кабинет",
    content: "Забронировать кабинет",
  },
  {
    key: MENU_ITEM_TYPES.USERS,
    name: "Пользователи",
    submenu: SUBMENU_TYPES.ALL_USERS,
    options: { columns: 2 },
    roles: [ROLES.ADMIN, ROLES.EDITOR],
  },
  {
    key: MENU_ITEM_TYPES.ALL_THERAPY_REQUESTS,
    name: "Заявки",
    roles: [ROLES.ADMIN, ROLES.EDITOR],
  },
  {
    key: MENU_ITEM_TYPES.ALL_THERAPY_REQUESTS_NEW,
    name: "Новые заяки",
    options: { columns: 2 },
    submenu: SUBMENU_TYPES.ALL_THERAPY_REQUESTS,
    // submenuPreload: true,
    props: [{ accepted: false }],
  },
  {
    key: MENU_ITEM_TYPES.ALL_THERAPY_REQUESTS_ACCEPTED,
    name: "Принятые заявки",
    options: { columns: 2 },
    submenu: SUBMENU_TYPES.ALL_THERAPY_REQUESTS,
    // submenuPreload: true,
    props: [{ accepted: true }],
  },
  {
    key: MENU_ITEM_TYPES.CLIENTS,
    name: "Мои клиенты",
    roles: [ROLES.PSYCHOLOGIST],
  },
  {
    key: MENU_ITEM_TYPES.CLIENTS_LIST,
    name: "Список клиентов",
    submenu: SUBMENU_TYPES.PSYCHOLOGIST_CLIENTS,
    options: { columns: 2 },
  },
  {
    key: MENU_ITEM_TYPES.CLIENTS_ADD,
    name: "Добавить клиента",
    conversation: CONVERSATION_NAMES.CLIENT_ADD,
    roles: [ROLES.PSYCHOLOGIST],
  },
  {
    key: MENU_ITEM_TYPES.THERAPY_REQUESTS,
    name: "Мои заявки",
    roles: [ROLES.PSYCHOLOGIST],
  },
  {
    key: MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW,
    name: "Новые заяки",
    options: { columns: 2 },
    submenu: SUBMENU_TYPES.PSYCHOLOGIST_THERAPY_REQUESTS,
    // submenuPreload: true,
    props: [{ accepted: false }],
  },
  {
    key: MENU_ITEM_TYPES.THERAPY_REQUESTS_ACCEPTED,
    name: "Принятые заявки",
    options: { columns: 2 },
    submenu: SUBMENU_TYPES.PSYCHOLOGIST_THERAPY_REQUESTS,
    // submenuPreload: true,
    props: [{ accepted: true }],
  },
  {
    key: MENU_ITEM_TYPES.SEND_THERAPY_REQUEST,
    name: "Оставить заявку",
    content: "Опишите пожалуйста ваш запрос",
    conversation: CONVERSATION_NAMES.THERAPY_REQUEST_ADD,
  },
]

export default menuItemsList
