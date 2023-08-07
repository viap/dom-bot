import { Keyboard } from "grammy"
import { UserDto } from "../../common/dto/user.dto"
import { ROLES } from "../../common/enums/roles.enum"
import { ACTION_BUTTONS } from "../../conversations/enums/actionButtons.enum"
import { CONVERSATION_NAMES } from "../../conversations/enums/conversationNames.enum"
import { MenuBlockItemsParams } from "./types/menuBlockItemsParams.type"
import { MenuBlockItemsProps } from "./types/menuBlockItemsProps.type"
import { MenuBlockOptions } from "./types/menuBlockOptions.type"

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
    withNavigationButtons: true,
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
    roles: Array<ROLES> = [ROLES.USER]
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

  getCurrent(): MenuBlockItemsProps {
    return this.current
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

  private get navigationButtons(): Keyboard {
    const topButtonsKeyboard = new Keyboard()

    if (
      this.options.withNavigationButtons &&
      this.current.name !== this.menu.name
    ) {
      topButtonsKeyboard
        .add({ text: ACTION_BUTTONS.BACK })
        .add({ text: ACTION_BUTTONS.HOME })
        .row()
    }

    return topButtonsKeyboard
  }

  private get paginationButtons(): Keyboard {
    const bottomButtonsKeyboard = new Keyboard()

    this.updateItemsParams()

    if (this.itemsParams.pagesCount > 1 && this.itemsParams.pageNumber > 0) {
      bottomButtonsKeyboard.add(ACTION_BUTTONS.PREV)
    }
    if (
      this.itemsParams.pagesCount > 1 &&
      this.itemsParams.pageNumber < this.itemsParams.pagesCount - 1
    ) {
      bottomButtonsKeyboard.add(ACTION_BUTTONS.NEXT)
    }

    if (bottomButtonsKeyboard.keyboard.length) {
      bottomButtonsKeyboard.row()
    }

    return bottomButtonsKeyboard
  }

  getKeyboard(): Keyboard {
    const keyboard = new Keyboard()
    const availableItems = this.getCurrentAvailableItems()

    this.updateItemsParams()

    const currentItems = availableItems.slice(
      this.itemsParams.pageNumber * this.options.maxItemsOnScreen,
      this.itemsParams.pageNumber * this.options.maxItemsOnScreen +
        this.options.maxItemsOnScreen
    )

    currentItems.forEach((item: MenuBlockItemsProps) => {
      keyboard.add(item.name).row()
    })

    return this.navigationButtons
      .append(keyboard)
      .append(this.paginationButtons)
  }
}
