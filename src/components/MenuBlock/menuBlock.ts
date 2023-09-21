import { Conversation } from "@grammyjs/conversations"
import { ClientDto } from "../../common/dto/client.dto"
import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { BotConversation } from "../../conversations/types/botConversation"
import { Keyboard } from "grammy"
import { TherapyRequestDto } from "../../common/dto/therapyRequest.dto"
import { UserDto } from "../../common/dto/user.dto"
import { ACTION_BUTTON_TEXTS } from "../../common/enums/actionButtonTexts.enum"
import { BOT_ERRORS } from "../../common/enums/botErrors.enum"
import { ROLES } from "../../common/enums/roles.enum"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { BotConversations } from "../../conversations/index"
import { ConversationResult } from "../../conversations/types/conversationResult"
import { defaultRoles } from "./consts/defaultRoles"
import { SUBMENU_TYPES } from "./enums/submenuTypes.enum"
import {
  getClientMenuItem,
  loadClientsMenuItems,
} from "./submenus/getClientsMenuItems"
import {
  getPsychologistTherapyRequestMenuItem,
  loadPsychologistTherapyRequestsMenuItems,
} from "./submenus/getPsychologistTherapyRequestsMenuItems"
import {
  getTherapyRequestMenuItem,
  loadTherapyRequestsMenuItems,
} from "./submenus/getTherapyRequestsMenuItems"
import {
  getTherapySessionMenuItem,
  loadTherapySessionsMenuItems,
} from "./submenus/getTherapySessionsMenuItems"
import {
  getUserMenuItem,
  loadUsersMenuItems,
} from "./submenus/getUsersMenuItems"
import { MenuBlockItemsParams } from "./types/menuBlockItemsParams.type"
import { MenuBlockItemsProps } from "./types/menuBlockItemsProps.type"
import { MenuBlockOptions } from "./types/menuBlockOptions.type"
import { randomUUID } from "crypto"

const defaultItemsParams: MenuBlockItemsParams = {
  pageNumber: 0,
  pagesCount: 1,
}

const defaultMenuOptions: MenuBlockOptions = {
  maxItemsOnScreen: 100,
  withNavigationButtons: true,
  columns: 1,
  withSearch: false,
}
export default class MenuBlock {
  private current: MenuBlockItemsProps
  private menu: MenuBlockItemsProps

  private options: MenuBlockOptions = defaultMenuOptions

  private itemsParams: MenuBlockItemsParams = {
    pageNumber: defaultItemsParams.pageNumber,
    pagesCount: defaultItemsParams.pagesCount,
  }

  constructor(
    private conversation: Conversation<MyContext>,
    private ctx: MyContext,
    menu: Partial<MenuBlockItemsProps>,
    options?: Partial<MenuBlockOptions>
  ) {
    this.menu = MenuBlock.getMenuFilteredByRoles(
      MenuBlock.getPreparedMenu(menu),
      ctx.user.roles.length ? ctx.user.roles : undefined
    )

    this.current = this.menu
    this.options = Object.assign(
      {},
      defaultMenuOptions,
      this.current.options,
      options
    )

    this.setDefaultItemsParams()
  }

  static getPreparedMenu(
    item: Partial<MenuBlockItemsProps>,
    parent?: MenuBlockItemsProps,
    roles: Array<ROLES> = defaultRoles
  ): MenuBlockItemsProps {
    const menu = {
      ...item,
      key: item.key || `${item.name}_${randomUUID()}`,
      parent: item.parent || parent,
      roles: item.roles || parent?.roles || roles,
    } as MenuBlockItemsProps

    menu.items = (menu.items || []).map((item) => {
      return this.getPreparedMenu(item, menu, item.roles || menu.roles)
    })

    return menu
  }

  static getMenuFilteredByRoles(
    item: MenuBlockItemsProps,
    availableRoles: Array<ROLES> = defaultRoles
  ) {
    const menu = { ...item }
    menu.items = (menu.items || [])
      .filter((item) => {
        return (item.roles || menu.roles || []).find((role) =>
          availableRoles.includes(role)
        )
      })
      .map((item) => {
        return this.getMenuFilteredByRoles(item, availableRoles)
      })

    return menu
  }

  set currentItems(items: Array<MenuBlockItemsProps>) {
    this.current.items = items
  }

  get currentItems(): Array<MenuBlockItemsProps> {
    return this.current.items || []
  }

  get currentOptions(): MenuBlockOptions {
    return this.current.options
      ? Object.assign({}, this.options, this.current.options)
      : this.options
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

  private get filterKeyboard(): Keyboard {
    const filterKeyboard = new Keyboard()

    if (this.currentOptions.withSearch && this.currentItems.length > 0) {
      filterKeyboard.row({ text: ACTION_BUTTON_TEXTS.SEARCH })
    }

    return filterKeyboard
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

  private findItem(
    itemKey?: string,
    item?: MenuBlockItemsProps,
    direction: "up" | "down" = "down"
  ): MenuBlockItemsProps | undefined {
    const menu = item || this.menu

    if (menu.key === itemKey || !itemKey) {
      return menu
    } else if (direction === "down") {
      return (menu.items || []).find((child) => {
        return this.findItem(itemKey, child, direction)
      })
    } else if (direction === "up" && menu.parent) {
      return this.findItem(itemKey, menu.parent, direction)
    }
  }

  private async makeAction(text: string) {
    switch (text) {
      case ACTION_BUTTON_TEXTS.SEARCH:
        // this.nextPage()
        break
      case ACTION_BUTTON_TEXTS.NEXT:
        this.nextPage()
        break
      case ACTION_BUTTON_TEXTS.PREV:
        this.prevPage()
        break
      case ACTION_BUTTON_TEXTS.BACK:
        this.selectParent()
        break
      case ACTION_BUTTON_TEXTS.MAIN_MENU:
        this.selectRoot()
        break
      default:
        this.selectItem(this.getKeyByName(text))
        break
    }
  }

  private async loadSubmenuItems(
    submenuType: SUBMENU_TYPES
  ): Promise<Array<MenuBlockItemsProps>> {
    switch (submenuType) {
      case SUBMENU_TYPES.ALL_USERS:
        return await loadUsersMenuItems(this.ctx, this.current)

      case SUBMENU_TYPES.PSYCHOLOGIST_CLIENTS:
        return await loadClientsMenuItems(this.ctx, this.current)

      case SUBMENU_TYPES.PSYCHOLOGIST_CLIENT_THERAPY_SESSIONS:
        return await loadTherapySessionsMenuItems(
          this.ctx,
          this.current,
          this.current.props as [ClientDto, TherapySessionDto[]]
        )
      case SUBMENU_TYPES.ALL_THERAPY_REQUESTS:
        return await loadTherapyRequestsMenuItems(this.ctx, this.current)

      case SUBMENU_TYPES.PSYCHOLOGIST_THERAPY_REQUESTS:
        return await loadPsychologistTherapyRequestsMenuItems(
          this.ctx,
          this.current
        )
      default:
        return []
    }
  }

  private getSubmenuItem(
    submenuType: SUBMENU_TYPES,
    parent: MenuBlockItemsProps,
    props: Array<unknown> = []
  ): MenuBlockItemsProps {
    switch (submenuType) {
      case SUBMENU_TYPES.ALL_USERS:
        return getUserMenuItem(parent, ...(props as [UserDto]))

      case SUBMENU_TYPES.PSYCHOLOGIST_CLIENTS:
        return getClientMenuItem(
          parent,
          ...(props as [ClientDto, Array<TherapySessionDto>])
        )
      case SUBMENU_TYPES.PSYCHOLOGIST_CLIENT_THERAPY_SESSIONS:
        return getTherapySessionMenuItem(
          parent,
          ...(props as [ClientDto, TherapySessionDto])
        )

      case SUBMENU_TYPES.ALL_THERAPY_REQUESTS:
        return getTherapyRequestMenuItem(
          parent,
          ...(props as [TherapyRequestDto])
        )

      case SUBMENU_TYPES.PSYCHOLOGIST_THERAPY_REQUESTS:
        return getPsychologistTherapyRequestMenuItem(
          parent,
          ...(props as [TherapyRequestDto])
        )
    }
  }

  async printItemContent(item: MenuBlockItemsProps = this.current) {
    await this.ctx.reply(
      ReplyMarkup.escapeForParseModeV2(`[ ${item.name.toUpperCase()} ]`),
      ReplyMarkup.parseModeV2
    )

    if (item.content) {
      await this.ctx.reply(
        typeof item.content === "string"
          ? item.content
          : item.content(...(item.props || [])),
        ReplyMarkup.parseModeV2
      )
    }
  }

  async showCurrentItems() {
    if (this.currentItems.length) {
      await this.ctx.reply(ReplyMarkup.escapeForParseModeV2(`[ ... ]`), {
        ...ReplyMarkup.keyboard(this.getKeyboard()),
        ...ReplyMarkup.oneTime,
        ...ReplyMarkup.parseModeV2,
      })
    }
  }
  async show() {
    this.selectItem(undefined, true)

    let keepGoing = true
    do {
      await this.printItemContent()

      try {
        if (this.current.conversation) {
          const botConversation = BotConversations.getByName(
            this.current.conversation
          )
          if (botConversation) {
            await this.showConversation(botConversation)
            continue
          }
        }
      } catch (e) {
        this.conversation.log(BOT_ERRORS.CONVERSATION, e)
      } finally {
        keepGoing = true
      }

      if (this.current.submenu) {
        this.currentItems = await this.conversation.external(async () => {
          return this.current.submenu
            ? await this.loadSubmenuItems(this.current.submenu)
            : []
        })
      }

      if (!this.currentItems.length && this.current.parent) {
        this.selectParent()
        continue
      }

      if (!this.currentItems.length) {
        keepGoing = false
        break
      }

      await this.showCurrentItems()

      this.ctx = await this.conversation.waitFor("message:text")
      const text = this.ctx.msg?.text || ""

      this.makeAction(text)
    } while (keepGoing)
  }

  printMenuStructure(curItem: MenuBlockItemsProps = this.menu, depth = 0) {
    if (depth === 0) {
      this.conversation.log(
        "\r\n@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\r\n"
      )
    }
    const isCurrent =
      curItem.key === this.current.key &&
      curItem.parent?.key === this.current.parent?.key
    const tab = isCurrent ? "---" : "   "

    this.conversation.log(
      new Array(depth).fill(tab).join("") +
        (curItem.parent ? `[ ${curItem.parent.name} ] => ` : "") +
        curItem.key +
        ` < ${(curItem.roles || []).join(" | ")} >`
    )
    ;(curItem.items || []).forEach((item) => {
      this.printMenuStructure(item, depth + 1)
    })
  }

  private async showConversation(botConversation: BotConversation) {
    const props = this.current.props || []

    const conversationResult = (await botConversation.getConversation(...props)(
      this.conversation,
      this.ctx
    )) as ConversationResult | undefined

    this.conversation.log("conversationResult", conversationResult)

    if (conversationResult) {
      // -------------------------- Might need to be removed:start --------------------------------- //
      // if (conversationResult.current) {
      //   Object.assign(this.current, conversationResult.current)
      //   this.conversation.log("UPDATE_CURRENT", this.current)
      // }

      // if (conversationResult.currentProps) {
      //   this.conversation.log("UPDATE_CURRENT_PROPS:before", this.current)
      //   this.current = this.updateItemByProps(
      //     this.current,
      //     conversationResult.currentProps
      //   )
      //   this.conversation.log("UPDATE_CURRENT_PROPS:after", this.current)
      // }

      // if (this.current.parent) {
      //   if (conversationResult.parent) {
      //     this.conversation.log("UPDATE_PARENT:before", this.current.parent)
      //     Object.assign(this.current.parent, conversationResult.parent)
      //     this.conversation.log("UPDATE_PARENT:after", this.current.parent)
      //   }

      //   if (conversationResult.parentProps) {
      //     this.conversation.log(
      //       "UPDATE_PARENT_PROPS:before",
      //       this.current.parent
      //     )

      //     // NOTICE: something going wrong after assign NAME prop
      //     // conversation stuck on waitFor step and nothing happens
      //     Object.assign(this.current.parent, {
      //       ...this.updateItemByProps(
      //         this.current.parent,
      //         conversationResult.parentProps
      //       ),
      //     })

      //     this.conversation.log(
      //       "UPDATE_PARENT_PROPS:after",
      //       this.current.parent
      //     )
      //   }
      // }
      // -------------------------- Might need to be removed:end --------------------------------- //

      if (conversationResult.stepsBack) {
        const item = this.getItemOnStepsBack(conversationResult.stepsBack)
        if (item) {
          this.selectItem(item.key, false, "up")
          return
        }
      } else if (conversationResult.goTo) {
        this.selectItem(
          conversationResult.goTo,
          conversationResult.goToFromTheTop,
          conversationResult.goToDirection
        )
        return
      }
    }

    this.selectParent()
  }

  private updateItemByProps(item: MenuBlockItemsProps, props: Array<unknown>) {
    if (item.parent?.submenu) {
      this.getSubmenuItem(item.parent.submenu, item.parent, props)
    } else {
      return { ...item, props }
    }
  }

  getItemOnStepsBack(
    steps = 1,
    item: MenuBlockItemsProps = this.current
  ): MenuBlockItemsProps | undefined {
    if (steps > 0) {
      return item.parent
        ? this.getItemOnStepsBack(steps - 1, item.parent)
        : undefined
    } else {
      return item
    }
  }

  selectRoot() {
    return this.selectItem(undefined, true)
  }

  selectParent() {
    if (this.current.parent) {
      this.current = this.current.parent
    }
  }

  getKeyByName(itemName?: string): string | undefined {
    return itemName
      ? this.currentItems.find((item) => item.name === itemName)?.key
      : undefined
  }

  selectItem(
    itemKey?: string,
    fromTheTop = false,
    direction: "up" | "down" = "down"
  ) {
    // this.conversation.log("PARAMS", itemName, fromTheTop, direction)
    // this.conversation.log("Current", this.current)

    const resultDirection = fromTheTop ? "down" : direction
    const item = fromTheTop ? this.menu : this.current

    const result = this.findItem(itemKey, item, resultDirection)
    this.current = result ? result : this.menu

    // this.conversation.log(
    //   "result",
    //   this.current.name,
    //   this.current.parent?.name
    // )
    this.printMenuStructure()

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
