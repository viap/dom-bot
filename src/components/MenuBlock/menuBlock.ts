import { Keyboard } from "grammy"
import { Roles } from "../../common/enums/roles.enum"
import { UserDto } from "../../common/dto/user.dto"
import { CONVERSATION_SELECT_MENU_ITEM_TEXTS } from "../../conversations/enums/conversationSelectMenuItemTexts.enum"
import { CONVERSATION_NAMES } from "../../conversations/enums/conversationNames.enum"
import { MenuBlockItemsProps } from "./types/menuBlockItemsProps.type"
import { MenuBlockOptions } from "./types/menuBlockOptions.type"
import { MenuBlockItemsParams } from "./types/menuBlockItemsParams.type"

const defaultItemsParams: MenuBlockItemsParams = {
  pageNumber: 0,
  pagesCount: 1,
}

export class MenuBlock {
  private current: MenuBlockItemsProps
  private menu: MenuBlockItemsProps
  private user: UserDto

  private options: MenuBlockOptions = {
    maxItemsOnScreen: 100,
  }

  private itemsParams: MenuBlockItemsParams = {
    pageNumber: defaultItemsParams.pageNumber,
    pagesCount: defaultItemsParams.pagesCount,
  }

  constructor(
    user: UserDto,
    menu: MenuBlockItemsProps,
    options?: MenuBlockOptions
  ) {
    this.user = user
    this.menu = { ...menu }
    this.current = menu
    this.options = options ? options : this.options

    // put down the roles
    this.putDownTheRoles(this.menu)
    this.setDefaultItemsParams()
  }

  private putDownTheRoles(
    menu: MenuBlockItemsProps,
    roles: Array<Roles> = [Roles.User]
  ) {
    menu.roles = menu.roles || roles
    if (menu.items) {
      menu.items.forEach((item) => {
        this.putDownTheRoles(item, item.roles || menu.roles)
      })
    }
  }

  private setDefaultItemsParams() {
    this.itemsParams.pageNumber = defaultItemsParams.pageNumber
    this.itemsParams.pagesCount = defaultItemsParams.pagesCount
  }

  private updateItemsParams() {
    this.itemsParams.pagesCount = Math.ceil(
      this.getCurrentAvailableItems().length / this.options.maxItemsOnScreen
    )

    this.itemsParams.pageNumber =
      this.itemsParams.pageNumber >= 0 &&
      this.itemsParams.pageNumber < this.itemsParams.pagesCount
        ? this.itemsParams.pageNumber
        : 0
  }

  getCurrentAvailableItems() {
    const items = this.current.items || []
    const parentRoles = this.current.roles || []

    return items.filter((item) => {
      return (item.roles || parentRoles).find((role) =>
        this.user.roles.includes(role)
      )
    })
  }

  getCurrentConversation(): CONVERSATION_NAMES | undefined {
    return this.current.conversation
  }

  getCurrentName(): string {
    return this.current.name
  }

  selectRoot() {
    return this.selectItem()
  }

  selectItem(itemName?: string) {
    if (!itemName) {
      this.current = this.menu
      return
    }

    const selectedItem = this.getCurrentAvailableItems().find(
      (item) => item.name === itemName
    )

    if (selectedItem) {
      this.current = selectedItem
    }

    this.setDefaultItemsParams()
  }

  nextPage() {
    this.itemsParams.pageNumber =
      this.itemsParams.pageNumber < this.itemsParams.pagesCount - 1
        ? this.itemsParams.pageNumber + 1
        : this.itemsParams.pagesCount - 1
  }

  prevPage() {
    this.itemsParams.pageNumber =
      this.itemsParams.pageNumber > 0 ? this.itemsParams.pageNumber - 1 : 0
  }

  getCurrent(): MenuBlockItemsProps {
    return this.current
  }

  getName(): string {
    return this.current.name
  }

  getKeyboard(): Keyboard {
    const buttons = new Keyboard()
    const availableItems = this.getCurrentAvailableItems()

    this.updateItemsParams()

    const currentItems = availableItems.slice(
      this.itemsParams.pageNumber * this.options.maxItemsOnScreen,
      this.itemsParams.pageNumber * this.options.maxItemsOnScreen +
        this.options.maxItemsOnScreen
    )

    currentItems.forEach((item: MenuBlockItemsProps) => {
      buttons.add(item.name).row()
    })

    const extraButtons = []
    if (this.itemsParams.pagesCount > 1 && this.itemsParams.pageNumber > 0) {
      extraButtons.push(CONVERSATION_SELECT_MENU_ITEM_TEXTS.PREV)
    }
    if (
      this.itemsParams.pagesCount > 1 &&
      this.itemsParams.pageNumber < this.itemsParams.pagesCount - 1
    ) {
      extraButtons.push(CONVERSATION_SELECT_MENU_ITEM_TEXTS.NEXT)
    }

    extraButtons.forEach((buttonText) => {
      buttons.add(buttonText)
    })

    if (extraButtons.length) {
      buttons.row()
    }

    return buttons
  }
}
