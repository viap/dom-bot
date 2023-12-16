import { PartialMenuBlockItemsProps } from "../types/menuBlockItemsProps.type"
import getMenuItemsMap from "../utils/getMenuItemsMap"

const mappedMenuItemsList = getMenuItemsMap()
const defaultMenu = {
  ...mappedMenuItemsList.main,
  items: [
    // menuItemsList.schedule,
    // menuItemsList.book,
    mappedMenuItemsList.about,
    mappedMenuItemsList.users,
    {
      ...mappedMenuItemsList.allTherapyRequests,
      items: [
        mappedMenuItemsList.allTherapyRequestsNew,
        mappedMenuItemsList.allTherapyRequestsAccepted,
      ],
    },
    {
      ...mappedMenuItemsList.clients,
      items: [
        mappedMenuItemsList.clientsList,
        mappedMenuItemsList.clientsAdd,
        {
          ...mappedMenuItemsList.statistic,
          items: [
            mappedMenuItemsList.week,
            mappedMenuItemsList.fortnight,
            mappedMenuItemsList.month,
          ],
        },
      ],
    },
    {
      ...mappedMenuItemsList.therapyRequests,
      items: [
        mappedMenuItemsList.therapyRequestsNew,
        mappedMenuItemsList.therapyRequestsAccepted,
      ],
    },
    mappedMenuItemsList.sendTherapyRequest,
  ],
} as PartialMenuBlockItemsProps

export default defaultMenu
