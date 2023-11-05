import { MenuBlockItemsProps } from "../types/menuBlockItemsProps.type"
import getMeppedMenuItems from "../utils/getMeppedMenuItems"

const mappedMenuItemsList = getMeppedMenuItems()
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
      items: [mappedMenuItemsList.clientsList, mappedMenuItemsList.clientsAdd],
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
} as Partial<MenuBlockItemsProps>

export default defaultMenu
