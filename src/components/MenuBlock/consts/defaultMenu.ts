import { ROLES } from "../../../common/enums/roles"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames"
import { MENU_ITEM_TYPES } from "../enums/menuItemTypes"
import { PartialMenuBlockItemsProps } from "../types/menuBlockItemsProps"
import getMenuItemsMap from "../utils/getMenuItemsMap"
import { defaultRoles } from "./defaultRoles"

const mappedMenuItemsList = getMenuItemsMap()
const defaultMenu = {
  ...mappedMenuItemsList[MENU_ITEM_TYPES.MAIN],
  roles: defaultRoles,
  items: [
    // menuItemsList.schedule,
    // menuItemsList.book,
    mappedMenuItemsList[MENU_ITEM_TYPES.ABOUT],
    mappedMenuItemsList[MENU_ITEM_TYPES.USERS],
    {
      ...mappedMenuItemsList[MENU_ITEM_TYPES.ALL_THERAPY_REQUESTS],
      items: [
        mappedMenuItemsList[MENU_ITEM_TYPES.ALL_THERAPY_REQUESTS_NEW],
        mappedMenuItemsList[MENU_ITEM_TYPES.ALL_THERAPY_REQUESTS_ACCEPTED],
      ],
    },
    {
      ...mappedMenuItemsList[MENU_ITEM_TYPES.CLIENTS],
      items: [
        mappedMenuItemsList[MENU_ITEM_TYPES.CLIENTS_LIST],
        mappedMenuItemsList[MENU_ITEM_TYPES.CLIENTS_ADD],
        {
          ...mappedMenuItemsList[MENU_ITEM_TYPES.PERSONAL_STATISTIC],
          items: [
            {
              ...mappedMenuItemsList[MENU_ITEM_TYPES.WEEK],
              conversation:
                CONVERSATION_NAMES.THERAPY_SESSIONS_PERSONAL_STATISTIC,
            },
            {
              ...mappedMenuItemsList[MENU_ITEM_TYPES.FORTNIGHT],
              conversation:
                CONVERSATION_NAMES.THERAPY_SESSIONS_PERSONAL_STATISTIC,
            },
            {
              ...mappedMenuItemsList[MENU_ITEM_TYPES.MONTH],
              conversation:
                CONVERSATION_NAMES.THERAPY_SESSIONS_PERSONAL_STATISTIC,
            },
          ],
        },
      ],
    },
    {
      ...mappedMenuItemsList[MENU_ITEM_TYPES.GENERAL_STATISTIC],
      roles: [ROLES.ADMIN, ROLES.ACCOUNTANT],
      items: [
        {
          ...mappedMenuItemsList[MENU_ITEM_TYPES.WEEK],
          conversation: CONVERSATION_NAMES.THERAPY_SESSIONS_GENERAL_STATISTIC,
        },
        {
          ...mappedMenuItemsList[MENU_ITEM_TYPES.FORTNIGHT],
          conversation: CONVERSATION_NAMES.THERAPY_SESSIONS_GENERAL_STATISTIC,
        },
        {
          ...mappedMenuItemsList[MENU_ITEM_TYPES.MONTH],
          conversation: CONVERSATION_NAMES.THERAPY_SESSIONS_GENERAL_STATISTIC,
        },
      ],
    },
    {
      ...mappedMenuItemsList[MENU_ITEM_TYPES.THERAPY_REQUESTS],
      items: [
        mappedMenuItemsList[MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW],
        mappedMenuItemsList[MENU_ITEM_TYPES.THERAPY_REQUESTS_ACCEPT],
      ],
    },
    mappedMenuItemsList[MENU_ITEM_TYPES.THERAPY_REQUESTS_SEND],
  ],
} as PartialMenuBlockItemsProps

export default defaultMenu
