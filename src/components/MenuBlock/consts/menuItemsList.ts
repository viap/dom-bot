import { PERIODS } from "@/common/enums/periods"
import { CONVERSATION_NAMES } from "@/conversations/enums/conversationNames"
import { MENU_ITEM_TYPES } from "../enums/menuItemTypes"
import { SUBMENU_TYPES } from "../enums/submenuTypes"
import { PartialMenuBlockItemsProps } from "../types/menuBlockItemsProps"

const menuItemsList: Array<
  PartialMenuBlockItemsProps & Required<{ key: string }>
> = [
  {
    key: MENU_ITEM_TYPES.MAIN,
    name: "Основное меню",
  },
  {
    key: MENU_ITEM_TYPES.ABOUT,
    name: "О нас",
    content: `
    *Психологический центр DOM*\r\n\r\n*_Кто мы?_*\r\nКоманда профессиональных психологов и психотерапевтов разных модальностей, объединённых общими ценностями гуманизма и веры в людей🕊️`,
  },
  {
    key: MENU_ITEM_TYPES.APPLICATION_MESSAGES,
    name: "Мои переписки",
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
    options: { columns: 2, withSearch: true },
  },
  {
    key: MENU_ITEM_TYPES.ALL_THERAPY_REQUESTS,
    name: "Заявки",
  },
  {
    key: MENU_ITEM_TYPES.ALL_THERAPY_REQUESTS_NEW,
    name: "Новые заявки",
    submenu: SUBMENU_TYPES.ALL_THERAPY_REQUESTS,
    options: { columns: 2, withSearch: true },
    // submenuPreload: true,
    props: [{ accepted: false }],
  },
  {
    key: MENU_ITEM_TYPES.ALL_THERAPY_REQUESTS_ACCEPTED,
    name: "Принятые заявки",
    submenu: SUBMENU_TYPES.ALL_THERAPY_REQUESTS,
    options: { columns: 2, withSearch: true },
    // submenuPreload: true,
    props: [{ accepted: true }],
  },
  {
    key: MENU_ITEM_TYPES.CLIENTS,
    name: "Мои клиенты",
  },
  {
    key: MENU_ITEM_TYPES.CLIENTS_LIST,
    name: "Список клиентов",
    submenu: SUBMENU_TYPES.PSYCHOLOGIST_CLIENTS,
    options: { columns: 2, withSearch: true },
  },
  {
    key: MENU_ITEM_TYPES.CLIENTS_ADD,
    name: "Добавить клиента",
    conversation: CONVERSATION_NAMES.CLIENT_ADD,
  },
  {
    key: MENU_ITEM_TYPES.THERAPY_REQUESTS,
    name: "Мои заявки",
  },
  {
    key: MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW,
    name: "Новые заявки",
    submenu: SUBMENU_TYPES.PSYCHOLOGIST_THERAPY_REQUESTS,
    options: { columns: 2, withSearch: true },
    // submenuPreload: true,
    props: [{ accepted: false }],
  },
  {
    key: MENU_ITEM_TYPES.THERAPY_REQUESTS_ACCEPTED,
    name: "Принятые заявки",
    submenu: SUBMENU_TYPES.PSYCHOLOGIST_THERAPY_REQUESTS,
    options: { columns: 2, withSearch: true },
    // submenuPreload: true,
    props: [{ accepted: true }],
  },
  {
    key: MENU_ITEM_TYPES.THERAPY_REQUESTS_SEND,
    name: "Оставить заявку",
    content: "Опишите пожалуйста ваш запрос",
    conversation: CONVERSATION_NAMES.THERAPY_REQUEST_ADD,
  },
  {
    key: MENU_ITEM_TYPES.PERSONAL_STATISTIC,
    name: "Статистика",
  },
  {
    key: MENU_ITEM_TYPES.GENERAL_STATISTIC,
    name: "Cтатистика",
  },
  {
    key: MENU_ITEM_TYPES.WEEK,
    name: "Текущая неделя",
    props: [PERIODS.WEEK],
  },
  {
    key: MENU_ITEM_TYPES.FORTNIGHT,
    name: "Текущая и прошлая недели",
    props: [PERIODS.FORTNIGHT],
  },
  {
    key: MENU_ITEM_TYPES.MONTH,
    name: "Текущий месяц",
    props: [PERIODS.MONTH],
  },
  {
    key: MENU_ITEM_TYPES.ARBITRARY,
    name: "Произвольный период",
  },
  {
    key: MENU_ITEM_TYPES.NOTIFICATIONS,
    name: "Рассылка уведомлений",
    conversation: CONVERSATION_NAMES.NOTIFICATIONS,
  },
]

export default menuItemsList
