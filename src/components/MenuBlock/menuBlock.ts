import { Conversation } from "@grammyjs/conversations"
import { randomUUID } from "crypto"
import { Keyboard } from "grammy"
import { PropType } from "@/api/type/propType"
// import { ClientDto } from "@/common/dto/client.dto"
// import { TherapyRequestDto } from "@/common/dto/therapyRequest.dto"
// import { TherapySessionDto } from "@/common/dto/therapySession.dto"
// import { UserDto } from "@/common/dto/user.dto"
import { ACTION_BUTTON_TEXTS } from "@/common/enums/actionButtonTexts"
import { BOT_ERRORS } from "@/common/enums/botErrors"
import { ROLES } from "@/common/enums/roles"
import { MyContext } from "@/common/types/myContext"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import toFirstCapitalLetter from "@/common/utils/toFirstCapitalLetter"
import { BotConversations } from "@/conversations/index"
import { BotConversation } from "@/conversations/types/botConversation"
import { ConversationResult } from "@/conversations/types/conversationResult"
import { defaultRoles } from "./consts/defaultRoles"
import { MENU_ITEM_TYPES } from "./enums/menuItemTypes"
import { SUBMENU_TYPES } from "./enums/submenuTypes"
import {
  // getClientMenuItem,
  loadClientsMenuItems,
} from "./submenus/getClientsMenuItems"
import {
  // getPsychologistTherapyRequestMenuItem,
  loadPsychologistTherapyRequestsMenuItems,
} from "./submenus/getPsychologistTherapyRequestsMenuItems"
import {
  // getTherapyRequestMenuItem,
  loadTherapyRequestsMenuItems,
} from "./submenus/getTherapyRequestsMenuItems"
import {
  // getTherapySessionMenuItem,
  loadTherapySessionsMenuItems,
} from "./submenus/getTherapySessionsMenuItems"
import {
  // getUserMenuItem,
  loadUsersMenuItems,
} from "./submenus/getUsersMenuItems"
import { MenuBlockItemsParams } from "./types/menuBlockItemsParams"
import {
  MenuBlockItemsProps,
  PartialMenuBlockItemsProps,
} from "./types/menuBlockItemsProps"
import { MenuBlockOptions } from "./types/menuBlockOptions"

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
  private static deepLink?: MENU_ITEM_TYPES

  static setDeepLink(goTo: MENU_ITEM_TYPES) {
    this.deepLink = goTo
  }

  static takeDeepLink() {
    const key = this.deepLink
    delete this.deepLink
    return key
  }

  static getPreparedMenu(
    sourceMenu: PartialMenuBlockItemsProps,
    parent?: MenuBlockItemsProps,
    roles: Array<ROLES> = defaultRoles
  ): MenuBlockItemsProps {
    const menu = {
      ...sourceMenu,
      key: sourceMenu.key || randomUUID(),
      parent: sourceMenu.parent || parent,
      roles: sourceMenu.roles || parent?.roles || roles,
    } as MenuBlockItemsProps

    menu.items = (menu.items || []).map((item) => {
      return this.getPreparedMenu(item, menu, item.roles || menu.roles)
    })

    return menu
  }

  static getMenuFilteredByRoles(
    sourceMenu: PartialMenuBlockItemsProps,
    availableRoles: Array<ROLES> = defaultRoles
  ) {
    const menu = {
      ...sourceMenu,
      items: (sourceMenu.items || [])
        .filter((item) => {
          return (item.roles || sourceMenu.roles || defaultRoles).find((role) =>
            availableRoles.includes(role)
          )
        })
        .map((item) => {
          return this.getMenuFilteredByRoles(item, availableRoles)
        }),
    } as MenuBlockItemsProps

    return menu
  }

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
    menu: PartialMenuBlockItemsProps,
    options?: Partial<MenuBlockOptions>
  ) {
    this.menu = MenuBlock.getPreparedMenu(
      MenuBlock.getMenuFilteredByRoles(
        menu as MenuBlockItemsProps,
        ctx.user.roles.length ? ctx.user.roles : undefined
      )
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
      if (menu.items?.length) {
        for (const child of menu.items) {
          const foundRes = this.findItem(itemKey, child, direction)
          if (foundRes) {
            return foundRes
          }
        }
      }
      return undefined
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

  private async loadSubmenuItems(parent: MenuBlockItemsProps = this.current) {
    let items: Array<PartialMenuBlockItemsProps> = []

    const props: [
      MyContext,
      MenuBlockItemsProps,
      PropType<MenuBlockItemsProps, "props">
    ] = [this.ctx, parent, parent.props || []]

    switch (parent.submenu) {
      case SUBMENU_TYPES.ALL_USERS:
        items = await this.conversation.external(async () => {
          return await loadUsersMenuItems(...props)
        })
        break

      case SUBMENU_TYPES.PSYCHOLOGIST_CLIENTS:
        items = await this.conversation.external(async () => {
          return await loadClientsMenuItems(...props)
        })
        break

      case SUBMENU_TYPES.PSYCHOLOGIST_CLIENT_THERAPY_SESSIONS:
        items = await this.conversation.external(async () => {
          return await loadTherapySessionsMenuItems(...props)
        })
        break

      case SUBMENU_TYPES.ALL_THERAPY_REQUESTS:
        items = await this.conversation.external(async () => {
          return await loadTherapyRequestsMenuItems(...props)
        })
        break

      case SUBMENU_TYPES.PSYCHOLOGIST_THERAPY_REQUESTS:
        items = await this.conversation.external(async () => {
          return await loadPsychologistTherapyRequestsMenuItems(...props)
        })

        break
    }

    parent.items = items.map((item) => {
      const filteredItems = MenuBlock.getPreparedMenu(
        MenuBlock.getMenuFilteredByRoles(
          item,
          this.ctx.user.roles.length ? this.ctx.user.roles : undefined
        )
      )

      return filteredItems
    })
  }

  getItemBreadCrumbsString(item: MenuBlockItemsProps = this.current): string {
    const result = [item.name]

    let parent = item.parent
    while (parent) {
      result.push(parent.name)
      parent = parent.parent
    }

    return result.reverse().map(toFirstCapitalLetter).join(" > ")
  }

  getItemContent(item: MenuBlockItemsProps = this.current) {
    const itemContent = [
      ReplyMarkup.escapeForParseModeV2(`${toFirstCapitalLetter(item.name)}:`),
    ]

    if (item.content) {
      itemContent.push(
        typeof item.content === "string"
          ? item.content
          : item.content(...(item.props || []))
      )
    } else if (!(this.currentItems.length || this.current.conversation)) {
      itemContent.push("*ПУСТО*")
    }

    return itemContent
  }

  async printItemContent(itemContent: Array<string> = this.getItemContent()) {
    if (itemContent.length) {
      for (let i = 0; i < itemContent.length; i++) {
        await this.ctx.reply(itemContent[i], ReplyMarkup.parseModeV2)
      }
    }
  }

  async showCurrentItems() {
    const itemContent = this.getItemContent()
    const replyContentWithButtons =
      itemContent.pop() || ReplyMarkup.escapeForParseModeV2(`[ ... ]`)

    await this.printItemContent(itemContent)

    if (this.currentItems.length) {
      await this.ctx.reply(replyContentWithButtons, {
        ...ReplyMarkup.keyboard(await this.getCurrentKeyboard()),
        ...ReplyMarkup.oneTime,
        ...ReplyMarkup.parseModeV2,
      })
    }
  }
  async show(itemKey?: string) {
    const deepLink = await this.conversation.external(() => {
      return MenuBlock.takeDeepLink()
    })

    this.selectItem(itemKey || deepLink, true)

    let keepGoing = true
    do {
      if (this.current.conversation) {
        try {
          await this.printItemContent()
          const botConversation = BotConversations.getByName(
            this.current.conversation
          )
          if (botConversation) {
            // NOTICE: fall inside a conversation
            await this.showConversation(botConversation)
          }
        } catch (e) {
          this.conversation.log(BOT_ERRORS.CONVERSATION, e)
        }
      }

      // NOTICE: load currentItems if they were not preloaded
      if (
        this.current.submenu &&
        !(this.current.submenuPreload && this.currentItems.length)
      ) {
        await this.loadSubmenuItems(this.current)
      }

      if (this.currentItems.length) {
        await this.showCurrentItems()
      } else {
        if (this.current.parent) {
          await this.printItemContent()
          this.selectParent()
          continue
        } else {
          keepGoing = false
          break
        }
      }

      if (process.env.NODE_ENV === "dev") {
        this.printMenuStructure()
      }

      this.ctx = await this.conversation.waitFor("message:text")
      const text = this.ctx.msg?.text || ""

      this.makeAction(text)
    } while (keepGoing)
  }

  printMenuStructure(curItem: MenuBlockItemsProps = this.menu, depth = 0) {
    if (depth === 0) {
      this.conversation.log(
        "\r\n-------------------------------------------------------------\r\n"
      )
    }
    const isCurrent =
      curItem.key === this.current.key &&
      curItem.parent?.key === this.current.parent?.key
    const tab = isCurrent ? "---" : "   "

    this.conversation.log(
      new Array(depth).fill(tab).join("") +
        ` ${curItem.name} {${curItem.key}} [${(curItem.roles || []).join(
          ", "
        )}] <= ${curItem.parent ? curItem.parent.name : "*"}`
    )

    if (curItem.items?.length) {
      curItem.items.forEach((item) => {
        this.printMenuStructure(item, depth + 1)
      })
    } else if (curItem.submenu) {
      this.conversation.log(
        `${new Array(depth + 1).fill(tab).join("")} [...${curItem.submenu}] `
      )
    }
  }

  private async showConversation(botConversation: BotConversation) {
    const props = this.current.props || []

    const conversationResult = (await botConversation.getConversation(...props)(
      this.conversation,
      this.ctx
    )) as ConversationResult | undefined

    if (conversationResult) {
      // FIXME: -------------------------- Might need to be removed:start --------------------------------- //
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
          this.selectItem(item.key, true, "down")
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

  // FIXME: -------------------------- Might need to be removed:start --------------------------------- //
  // private updateItemByProps(item: MenuBlockItemsProps, props: Array<unknown>) {
  //   if (item.parent?.submenu) {
  //     this.getSubmenuItem(item.parent.submenu, props)
  //   } else {
  //     return { ...item, props }
  //   }
  // }

  // private getSubmenuItem(
  //   submenuType: SUBMENU_TYPES,
  //   props: Array<unknown> = []
  // ): PartialMenuBlockItemsProps {
  //   switch (submenuType) {
  //     case SUBMENU_TYPES.ALL_USERS:
  //       return getUserMenuItem(...(props as [UserDto]))

  //     case SUBMENU_TYPES.PSYCHOLOGIST_CLIENTS:
  //       return getClientMenuItem(
  //         ...(props as [ClientDto, Array<TherapySessionDto>])
  //       )
  //     case SUBMENU_TYPES.PSYCHOLOGIST_CLIENT_THERAPY_SESSIONS:
  //       return getTherapySessionMenuItem(
  //         ...(props as [ClientDto, TherapySessionDto])
  //       )

  //     case SUBMENU_TYPES.ALL_THERAPY_REQUESTS:
  //       return getTherapyRequestMenuItem(...(props as [TherapyRequestDto]))

  //     case SUBMENU_TYPES.PSYCHOLOGIST_THERAPY_REQUESTS:
  //       return getPsychologistTherapyRequestMenuItem(
  //         ...(props as [TherapyRequestDto])
  //       )
  //   }
  // }
  // -------------------------- Might need to be removed:end --------------------------------- //

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
    const resultDirection = fromTheTop ? "down" : direction
    const item = fromTheTop ? this.menu : this.current

    const result = this.findItem(itemKey, item, resultDirection)
    this.current = result ? result : this.menu

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

  async getCurrentKeyboard(): Promise<Keyboard> {
    this.updateItemsParams()

    const availableItems = []
    for (let i = 0; i < this.currentItems.length; i++) {
      const item = this.currentItems[i]
      if (item.submenu && item.submenuPreload) {
        await this.loadSubmenuItems(item)

        if (!item.items?.length) {
          continue
        }
      }
      availableItems.push(item)
    }

    const currentItems = availableItems.slice(
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
