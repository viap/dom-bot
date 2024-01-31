import { ROLES } from "../../../common/enums/roles"
import { CONVERSATION_NAMES } from "../../../conversations/enums/conversationNames"
import { PartialMenuBlockItemsProps } from "../types/menuBlockItemsProps"
import getMenuItemsMap from "../utils/getMenuItemsMap"
import { defaultRoles } from "./defaultRoles"

const mappedMenuItemsList = getMenuItemsMap()
const defaultMenu = {
  ...mappedMenuItemsList.main,
  roles: defaultRoles,
  items: [
    // menuItemsList.schedule,
    // menuItemsList.book,
    mappedMenuItemsList.about,
    mappedMenuItemsList.users,
    {
      ...mappedMenuItemsList.allTherapyRequests,
      items: [
        mappedMenuItemsList.allTherapyRequestsNew,
        mappedMenuItemsList.allTherapyRequestsAccept,
      ],
    },
    {
      ...mappedMenuItemsList.clients,
      items: [
        mappedMenuItemsList.clientsList,
        mappedMenuItemsList.clientsAdd,
        {
          ...mappedMenuItemsList.personalStatistic,
          items: [
            {
              ...mappedMenuItemsList.week,
              conversation:
                CONVERSATION_NAMES.THERAPY_SESSIONS_PERSONAL_STATISTIC,
            },
            {
              ...mappedMenuItemsList.fortnight,
              conversation:
                CONVERSATION_NAMES.THERAPY_SESSIONS_PERSONAL_STATISTIC,
            },
            {
              ...mappedMenuItemsList.month,
              conversation:
                CONVERSATION_NAMES.THERAPY_SESSIONS_PERSONAL_STATISTIC,
            },
          ],
        },
      ],
    },
    {
      ...mappedMenuItemsList.generalStatistic,
      roles: [ROLES.ADMIN, ROLES.ACCOUNTANT],
      items: [
        {
          ...mappedMenuItemsList.week,
          conversation: CONVERSATION_NAMES.THERAPY_SESSIONS_GENERAL_STATISTIC,
        },
        {
          ...mappedMenuItemsList.fortnight,
          conversation: CONVERSATION_NAMES.THERAPY_SESSIONS_GENERAL_STATISTIC,
        },
        {
          ...mappedMenuItemsList.month,
          conversation: CONVERSATION_NAMES.THERAPY_SESSIONS_GENERAL_STATISTIC,
        },
      ],
    },
    {
      ...mappedMenuItemsList.therapyRequests,
      items: [
        mappedMenuItemsList.therapyRequestsNew,
        mappedMenuItemsList.therapyRequestsAccept,
      ],
    },
    mappedMenuItemsList.therapyRequestsSend,
  ],
} as PartialMenuBlockItemsProps

export default defaultMenu
