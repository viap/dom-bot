import { Conversation } from "@grammyjs/conversations"
import { CONVERSATION_NAMES } from "conversations/enums/conversationNames.enum"
import { Keyboard } from "grammy"
import { MyContext } from "types/myContext"
import { getMyClients } from "../../api/getMyClients"
import { UserDto } from "../../common/dto/user.dto"
import { ROLES } from "../../common/enums/roles.enum"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { ACTION_BUTTONS } from "../../conversations/enums/actionButtons.enum"
import { BotConversations } from "../../conversations/index"
import { MENU_DATA_TYPES } from "./enums/menuDataTypes.enum"
import { MenuBlockItemsParams } from "./types/menuBlockItemsParams.type"
import { MenuBlockItemsProps } from "./types/menuBlockItemsProps.type"
import { MenuBlockOptions } from "./types/menuBlockOptions.type"

const defaultItemsParams: MenuBlockItemsParams = {
  pageNumber: 0,
  pagesCount: 1,
}

const defaultOptions: MenuBlockOptions = {
  maxItemsOnScreen: 100,
  withNavigationButtons: true,
  columns: 1,
}

export class MenuBlock {
  private current: MenuBlockItemsProps
  private parent?: MenuBlockItemsProps

  private menu: MenuBlockItemsProps
  private user: UserDto

  private options: MenuBlockOptions = defaultOptions

  private itemsParams: MenuBlockItemsParams = {
    pageNumber: defaultItemsParams.pageNumber,
    pagesCount: defaultItemsParams.pagesCount,
  }

  constructor(
    user: UserDto,
    menu: MenuBlockItemsProps,
    options?: Partial<MenuBlockOptions>
  ) {
    this.user = user
    let preparedMenu = { ...menu }
    preparedMenu = this.getMenuWithRoles(preparedMenu)
    preparedMenu = this.getMenuFilteredByRoles(preparedMenu)

    this.menu = preparedMenu
    this.current = this.menu
    this.options = Object.assign(
      {},
      defaultOptions,
      this.current.options,
      options
    )

    this.setDefaultItemsParams()
  }

  getCurrent(): MenuBlockItemsProps {
    return this.current
  }

  getParent(): MenuBlockItemsProps | undefined {
    return this.parent
  }

  set currentItems(items: Array<MenuBlockItemsProps>) {
    this.current.items = items
  }

  get currentItems() {
    return this.current.items || []
  }

  get parentName(): string | undefined {
    return this.parent ? this.parent.name : undefined
  }

  get currentOptions(): MenuBlockOptions {
    return this.current.options
      ? Object.assign({}, this.options, this.current.options)
      : this.options
  }

  private getMenuWithRoles(
    item: MenuBlockItemsProps,
    roles: Array<ROLES> = [ROLES.USER]
  ) {
    const menu = { ...item }
    menu.roles = menu.roles || roles
    if (menu.items) {
      menu.items.map((item) => {
        this.getMenuWithRoles(item, item.roles || menu.roles)
      })
    }

    return menu
  }

  private getMenuFilteredByRoles(item?: MenuBlockItemsProps) {
    const menu = { ...(item || this.menu) }
    const items = menu.items || []
    const menuRoles = menu.roles || []

    menu.items = items.filter((item) => {
      return (item.roles || menuRoles).find((role) =>
        this.user.roles.includes(role)
      )
    })

    menu.items.map((item) => {
      return this.getMenuFilteredByRoles(item)
    })

    return menu
  }

  private setDefaultItemsParams() {
    this.itemsParams.pageNumber = defaultItemsParams.pageNumber
    this.itemsParams.pagesCount = defaultItemsParams.pagesCount
  }

  private updateItemsParams() {
    this.itemsParams.pagesCount = Math.ceil(
      this.currentItems.length / this.currentOptions.maxItemsOnScreen
    )

    this.itemsParams.pageNumber =
      this.itemsParams.pageNumber >= 0 &&
      this.itemsParams.pageNumber < this.itemsParams.pagesCount
        ? this.itemsParams.pageNumber
        : 0
  }

  private findItemAndParent(
    itemName?: string,
    item?: MenuBlockItemsProps,
    ancestor?: MenuBlockItemsProps
  ):
    | { item: MenuBlockItemsProps; parent: MenuBlockItemsProps | undefined }
    | undefined {
    const menu = item || this.menu
    const parent = ancestor || this.parent

    if (menu.name === itemName || !itemName) {
      return { item: menu, parent }
    } else {
      let result
      ;(menu.items || []).find((child) => {
        result = this.findItemAndParent(itemName, child, menu)

        return !!result
      })

      if (result) {
        return result
      }
    }

    return undefined
  }

  private get navigationButtons(): Keyboard {
    const topButtonsKeyboard = new Keyboard()

    if (
      this.currentOptions.withNavigationButtons &&
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

  private makeAction(text: string) {
    switch (text) {
      case ACTION_BUTTONS.NEXT:
        this.nextPage()
        break
      case ACTION_BUTTONS.PREV:
        this.prevPage()
        break
      case ACTION_BUTTONS.BACK:
        this.selectItem(this.parentName)
        break
      case ACTION_BUTTONS.HOME:
        this.selectRoot()
        break
      default:
        this.selectItem(text)
        break
    }
  }

  private async uploadItems(
    ctx: MyContext,
    type: MENU_DATA_TYPES,
    conversation: CONVERSATION_NAMES
  ): Promise<Array<MenuBlockItemsProps>> {
    let items: Array<MenuBlockItemsProps> = []
    switch (type) {
      case MENU_DATA_TYPES.CLIENTS:
        items = (await getMyClients(ctx)).map((item) => {
          return {
            name: item.user.name,
            conversation,
            conversationProps: [item],
          } as MenuBlockItemsProps
        })
    }

    return items
  }

  async show(
    conversation: Conversation<MyContext>,
    ctx: MyContext,
    itemName?: string
  ) {
    this.selectItem(itemName)

    conversation.log("@@@@@@@@@@@@@ SHOW @@@@@@@@@@@@@@@@@@")

    let keepGoing = true
    do {
      if (!this.currentItems.length) {
        this.selectItem(this.parentName)
      }

      await ctx.reply(`[ ${this.current.name.toUpperCase()} ]`, {
        ...ReplyMarkup.keyboard(this.getKeyboard()),
        ...ReplyMarkup.oneTime,
        ...ReplyMarkup.parseModeV2,
      })

      ctx = await conversation.waitFor("message:text")
      const text = ctx.msg?.text || ""

      conversation.log("text", text)

      this.makeAction(text)

      conversation.log("current", this.current)
      conversation.log("parent", this.parent)

      try {
        if (this.current.from && this.current.conversation) {
          this.currentItems = await this.uploadItems(
            ctx,
            this.current.from,
            this.current.conversation
          )
        } else if (this.current.conversation) {
          const botConversation = BotConversations.getByName(
            this.current.conversation
          )
          if (botConversation) {
            const props = this.current.conversationProps
              ? this.current.conversationProps
              : []
            await botConversation.getConversation(...props)(conversation, ctx)
          }
        }
      } catch (e) {
        conversation.log("Произошла ошибка", e)
      } finally {
        keepGoing = true
      }
    } while (keepGoing)
  }

  selectRoot() {
    return this.selectItem()
  }

  selectItem(itemName?: string) {
    const result = this.findItemAndParent(itemName)

    if (result) {
      this.current = result.item
      this.parent = result.parent
    } else {
      this.parent = undefined
      this.current = this.menu
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

  getKeyboard(): Keyboard {
    const keyboard = new Keyboard()

    this.updateItemsParams()

    const currentItems = this.currentItems.slice(
      this.itemsParams.pageNumber * this.currentOptions.maxItemsOnScreen,
      this.itemsParams.pageNumber * this.currentOptions.maxItemsOnScreen +
        this.currentOptions.maxItemsOnScreen
    )

    currentItems.forEach((item: MenuBlockItemsProps) => {
      keyboard.add(item.name)
      // if (this.currentOptions.columns === 1) {
      keyboard.row()
      // }
    })
    keyboard.toFlowed(this.currentOptions.columns)

    return this.navigationButtons
      .append(keyboard)
      .append(this.paginationButtons)
  }
}
