import { ROLES } from "@/common/enums/roles"
import { MENU_ITEM_TYPES } from "../enums/menuItemTypes"
import getMenuItemsMap from "../utils/getMenuItemsMap"
import { defaultRoles } from "./defaultRoles"
import { CONVERSATION_NAMES } from "@/conversations/enums/conversationNames"
import { PartialMenuBlockItemsProps } from "../types/menuBlockItemsProps"

const mappedMenuItemsList = getMenuItemsMap()
const defaultMenu = {
  ...mappedMenuItemsList[MENU_ITEM_TYPES.MAIN],
  roles: defaultRoles,
  items: [
    // menuItemsList.schedule,
    // menuItemsList.book,
    mappedMenuItemsList[MENU_ITEM_TYPES.ABOUT],
    {
      ...mappedMenuItemsList[MENU_ITEM_TYPES.USERS],
      roles: [ROLES.ADMIN, ROLES.EDITOR],
    },
    {
      ...mappedMenuItemsList[MENU_ITEM_TYPES.ALL_THERAPY_REQUESTS],
      roles: [ROLES.ADMIN, ROLES.EDITOR],
      items: [
        mappedMenuItemsList[MENU_ITEM_TYPES.ALL_THERAPY_REQUESTS_NEW],
        mappedMenuItemsList[MENU_ITEM_TYPES.ALL_THERAPY_REQUESTS_ACCEPTED],
      ],
    },
    {
      ...mappedMenuItemsList[MENU_ITEM_TYPES.CLIENTS],
      roles: [ROLES.PSYCHOLOGIST],
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
        {
          ...mappedMenuItemsList[MENU_ITEM_TYPES.ARBITRARY],
          conversation: CONVERSATION_NAMES.THERAPY_SESSIONS_GENERAL_STATISTIC,
        },
      ],
    },
    {
      ...mappedMenuItemsList[MENU_ITEM_TYPES.THERAPY_REQUESTS],
      roles: [ROLES.PSYCHOLOGIST],
      items: [
        mappedMenuItemsList[MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW],
        mappedMenuItemsList[MENU_ITEM_TYPES.THERAPY_REQUESTS_ACCEPT],
      ],
    },
    {
      ...mappedMenuItemsList[MENU_ITEM_TYPES.THERAPY_REQUESTS_SEND],
      roles: [ROLES.ADMIN, ROLES.EDITOR],
    },
  ],
} as PartialMenuBlockItemsProps

export default defaultMenu
