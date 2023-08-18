import { Conversation } from "@grammyjs/conversations"
import { ClientDto } from "common/dto/client.dto"
import { TherapySessionDto } from "common/dto/therapySession.dto"
import { BotConversation } from "conversations/types/botConversation"
import { Keyboard } from "grammy"
import { UserDto } from "../../common/dto/user.dto"
import { ACTION_BUTTON_TEXTS } from "../../common/enums/actionButtonTexts.enum"
import { ROLES } from "../../common/enums/roles.enum"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { BotConversations } from "../../conversations/index"
import { ConversationResult } from "../../conversations/types/conversationResult"
import { defaultRoles } from "./consts/defaultRoles"
import { SUBMENU_TYPES } from "./enums/submenuTypes.enum"
import { loadClientsMenuItems } from "./submenus/getClientsMenuItems"
import { loadTherapySessionsMenuItems } from "./submenus/getTherapySessionsMenuItems"
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

  private options: MenuBlockOptions = defaultOptions

  private itemsParams: MenuBlockItemsParams = {
    pageNumber: defaultItemsParams.pageNumber,
    pagesCount: defaultItemsParams.pagesCount,
  }

  constructor(
    private conversation: Conversation<MyContext>,
    private ctx: MyContext,
    private user: UserDto,
    menu: MenuBlockItemsProps,
    options?: Partial<MenuBlockOptions>
  ) {
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
    roles: Array<ROLES> = defaultRoles
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
    const parent = ancestor || undefined

    if (menu.name === itemName || !itemName) {
      return { item: menu, parent }
    } else {
      let result = undefined

      ;(menu.items || []).find((child) => {
        result = this.findItemAndParent(itemName, child, menu)
        return !!result
      })

      return result
    }
  }

  private get navigationKeyboard(): Keyboard {
    const topButtonsKeyboard = new Keyboard()

    if (
      this.currentOptions.withNavigationButtons &&
      this.current.name !== this.menu.name
    ) {
      topButtonsKeyboard.row(
        { text: ACTION_BUTTON_TEXTS.BACK },
        { text: ACTION_BUTTON_TEXTS.MAIN_MENU }
      )
    }

    return topButtonsKeyboard
  }

  private get paginationKeyboard(): Keyboard {
    const bottomButtonsKeyboard = new Keyboard()

    this.updateItemsParams()

    if (this.itemsParams.pagesCount > 1 && this.itemsParams.pageNumber > 0) {
      bottomButtonsKeyboard.add(ACTION_BUTTON_TEXTS.PREV)
    }
    if (
      this.itemsParams.pagesCount > 1 &&
      this.itemsParams.pageNumber < this.itemsParams.pagesCount - 1
    ) {
      bottomButtonsKeyboard.add(ACTION_BUTTON_TEXTS.NEXT)
    }

    if (bottomButtonsKeyboard.keyboard.length) {
      bottomButtonsKeyboard.row()
    }

    return bottomButtonsKeyboard
  }

  private async makeAction(text: string) {
    switch (text) {
      case ACTION_BUTTON_TEXTS.NEXT:
        this.nextPage()
        break
      case ACTION_BUTTON_TEXTS.PREV:
        this.prevPage()
        break
      case ACTION_BUTTON_TEXTS.BACK:
        this.selectItem(this.parentName, true)
        break
      case ACTION_BUTTON_TEXTS.MAIN_MENU:
        this.selectRoot()
        break
      default:
        this.selectItem(text)
        break
    }
  }

  private async getSubmenuItems(
    submenuType: SUBMENU_TYPES
  ): Promise<Array<MenuBlockItemsProps>> {
    switch (submenuType) {
      case SUBMENU_TYPES.CLIENTS:
        return await loadClientsMenuItems(this.ctx, this.current)
      case SUBMENU_TYPES.THERAPY_SESSIONS:
        return await loadTherapySessionsMenuItems(
          this.ctx,
          this.current,
          this.current.conversationProps as [ClientDto, TherapySessionDto[]]
        )
      default:
        return []
    }
  }

  async printItemContent(item: MenuBlockItemsProps = this.current) {
    if (item.content) {
      await this.ctx.reply(
        typeof item.content === "string"
          ? item.content
          : item.content(...(item.conversationProps || [])),
        ReplyMarkup.parseModeV2
      )
    }
  }

  async printCurrentItems() {
    await this.ctx.reply(
      ReplyMarkup.escapeForParseModeV2(
        `[ ${this.current.name.toUpperCase()} ]`
      ),
      {
        ...ReplyMarkup.keyboard(this.getKeyboard()),
        ...ReplyMarkup.oneTime,
        ...ReplyMarkup.parseModeV2,
      }
    )
  }
  async show(itemName?: string) {
    this.selectItem(itemName, true)

    let keepGoing = true
    do {
      console.log("SHOW(CURRENT)", this.current)

      await this.printItemContent()

      if (this.current.submenu) {
        this.currentItems = await this.conversation.external(async () => {
          return this.current.submenu
            ? await this.getSubmenuItems(this.current.submenu)
            : []
        })
      }

      if (!this.currentItems.length) {
        this.selectItem(this.parentName, true)
      }

      await this.printCurrentItems()

      this.ctx = await this.conversation.waitFor("message:text")
      const text = this.ctx.msg?.text || ""

      this.makeAction(text)

      // this.conversation.log("------------------------------")
      // this.conversation.log("text", text)
      // this.conversation.log("current", this.current)
      // this.conversation.log("parent", this.parent)
      // this.conversation.log(
      //   "conversationProps",
      //   JSON.stringify(this.current.conversationProps)
      // )

      try {
        if (this.current.conversation) {
          const botConversation = BotConversations.getByName(
            this.current.conversation
          )
          if (botConversation) {
            await this.showConversation(botConversation)
          }
        }
      } catch (e) {
        this.conversation.log("Произошла ошибка", e)
      } finally {
        keepGoing = true
      }
    } while (keepGoing)
  }

  printMenuStructure(curItem: MenuBlockItemsProps = this.menu, depth = 0) {
    if (depth === 0) {
      this.conversation.log(
        "\r\n@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\r\n"
      )
    }
    const tab = "   "
    this.conversation.log(new Array(depth).fill(tab).join("") + curItem.name)
    ;(curItem.items || []).forEach((item) => {
      this.printMenuStructure(item, depth + 1)
    })
  }

  private async showConversation(botConversation: BotConversation) {
    const props = this.current.conversationProps
      ? this.current.conversationProps
      : []

    const conversationResult = (await botConversation.getConversation(...props)(
      this.conversation,
      this.ctx
    )) as ConversationResult

    this.conversation.log("conversationResult", conversationResult)

    if (conversationResult) {
      if (conversationResult.current) {
        Object.assign(this.current, conversationResult.current)
        this.conversation.log("UPDATE_CURRENT", this.current)
      }

      if (conversationResult.currentProps) {
        Object.assign(this.current, {
          conversationProps: conversationResult.currentProps,
        })
        this.conversation.log("UPDATE_PARENT_PROPS", this.parent)
      }

      if (this.parent) {
        if (conversationResult.parent) {
          Object.assign(this.parent, conversationResult.parent)
          this.conversation.log("UPDATE_CURRENT", this.current)
        }

        if (conversationResult.parentProps) {
          Object.assign(this.parent, {
            conversationProps: conversationResult.parentProps,
          })
          this.conversation.log("UPDATE_PARENT_PROPS", this.parent)
        }
      }

      if (conversationResult.goTo) {
        this.selectItem(
          conversationResult.goTo,
          conversationResult.goToFromTheTop
        )
      }
    }
  }

  selectRoot() {
    return this.selectItem(undefined, true)
  }

  selectItem(itemName?: string, fromTheTop = false) {
    this.conversation.log("SelectItem", itemName, fromTheTop)
    this.conversation.log("Current", this.current.name)
    this.conversation.log(
      "CurrentItems",
      this.currentItems.map((item) => item.name).join("|")
    )
    this.printMenuStructure()

    const item = fromTheTop ? this.menu : this.current
    const parent = fromTheTop ? undefined : this.parent

    this.printMenuStructure(item)

    const result = this.findItemAndParent(itemName, item, parent)

    this.conversation.log(
      "FIND: ",
      itemName + " in " + item.name + "(" + parent?.name + ")"
    )
    if (result) {
      this.conversation.log(
        "UPDATE current",
        this.current.name + " => " + result.item.name
      )
    } else {
      this.conversation.log("Empty result for")
    }

    if (result) {
      this.current = result.item
      this.parent = result.parent
    } else {
      this.parent = undefined
      this.current = this.menu
    }

    this.setDefaultItemsParams()

    this.conversation.log("CURRENT", this.current)
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
    this.updateItemsParams()

    const currentItems = this.currentItems.slice(
      this.itemsParams.pageNumber * this.currentOptions.maxItemsOnScreen,
      this.itemsParams.pageNumber * this.currentOptions.maxItemsOnScreen +
        this.currentOptions.maxItemsOnScreen
    )

    const keyboard = new Keyboard(
      currentItems.map((item: MenuBlockItemsProps) => [item.name])
    ).toFlowed(this.currentOptions.columns)

    return this.navigationKeyboard
      .append(keyboard)
      .append(this.paginationKeyboard)
  }
}
