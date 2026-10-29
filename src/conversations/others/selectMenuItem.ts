import MenuBlock from "@/components/MenuBlock/menuBlock"
import { Conversation } from "@grammyjs/conversations"

import { MyContext } from "@/common/types/myContext"
import { BOT_TEXTS } from "@/common/enums/botTexts"
import { ROLES } from "@/common/enums/roles"
import defaultMenu from "@/components/MenuBlock/consts/defaultMenu"
import { MENU_ITEM_TYPES } from "@/components/MenuBlock/enums/menuItemTypes"
import { PartialMenuBlockItemsProps } from "@/components/MenuBlock/types/menuBlockItemsProps"

import { CONVERSATION_ERRORS } from "../enums/conversationErrors"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversations } from "../index"
import { BotConversation } from "../types/botConversation"

async function checkAgreemensts(
  conversation: Conversation<MyContext>,
  ctx: MyContext
): Promise<boolean> {
  // ask for agreement if it is not get yet
  if (!conversation.session.hasTermsAgreement) {
    const termsComversation = BotConversations.getByName(
      CONVERSATION_NAMES.TERMS_AGREEMENT
    )

    if (termsComversation) {
      return !!(await termsComversation.getConversation()(conversation, ctx))
    }
  }

  return conversation.session.hasTermsAgreement
}

const menuItemSelect: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.SELECT_MENU_ITEM
  },

  getConversation() {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      if (!(await checkAgreemensts(conversation, ctx))) {
        delete conversation.session.menuDeepLink
        return
      }

      const menuDefinition = getMenuForCurrentProfile(ctx)
      const menu = menuDefinition
        ? new MenuBlock(conversation, ctx, menuDefinition)
        : undefined

      if (!menu) {
        await ctx.reply(CONVERSATION_ERRORS.EMPTY_MENU)
        return
      }

      await menu.show()
    }
  },
}

export function getMenuForCurrentProfile(
  ctx: Pick<MyContext, "session">
): PartialMenuBlockItemsProps {
  const missingPsychologistProfile = Boolean(
    ctx.session.user?.roles.includes(ROLES.PSYCHOLOGIST) &&
      !ctx.session.psychologist
  )

  const menu = cloneMenu(defaultMenu, missingPsychologistProfile)
  if (!ctx.session.applicationMessaging?.hasThreads) {
    menu.items = menu.items?.filter(
      (item) => item.key !== MENU_ITEM_TYPES.APPLICATION_MESSAGES
    )
  }
  return menu
}

function cloneMenu(
  item: PartialMenuBlockItemsProps,
  replacePsychologistSections: boolean
): PartialMenuBlockItemsProps {
  const isProfileDependentSection =
    item.key === MENU_ITEM_TYPES.CLIENTS ||
    item.key === MENU_ITEM_TYPES.THERAPY_REQUESTS

  if (replacePsychologistSections && isProfileDependentSection) {
    return {
      ...item,
      content: BOT_TEXTS.PSYCHOLOGIST_PROFILE_MISSING,
      items: undefined,
      submenu: undefined,
      submenuPreloaded: undefined,
      conversation: undefined,
      props: undefined,
    }
  }

  return {
    ...item,
    items: item.items?.map((child) =>
      cloneMenu(child, replacePsychologistSections)
    ),
  }
}

export default menuItemSelect
