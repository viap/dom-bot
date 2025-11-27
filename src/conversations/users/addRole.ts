import { editUser } from "@/api/controllerUsers/editUser"
import { EditUserDto } from "@/api/dto/editUser.dto"
import { ROLES_DESCR } from "@/common/consts/rolesDescr"
import { UserDto } from "@/common/dto/user.dto"
import { BOT_ERRORS } from "@/common/enums/botErrors"
import { ROLES } from "@/common/enums/roles"
import { MyContext } from "@/common/types/myContext"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { MENU_ITEM_TYPES } from "@/components/MenuBlock/enums/menuItemTypes"
import { Conversation } from "@grammyjs/conversations"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

const userAddRole: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.USER_ADD_ROLE
  },

  getConversation(user: UserDto, role: ROLES) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      let result = false

      try {
        const editedUser = (await conversation.external(async () => {
          return await editUser(ctx, user._id, {
            roles: user.roles
              .filter((userRole) => userRole !== role)
              .concat([role]),
          })
        })) as EditUserDto

        result = (editedUser?.roles || []).includes(role)
      } catch (e) {
        conversation.log(BOT_ERRORS.REQUEST, e)
      } finally {
        if (result === true) {
          await ctx.reply(
            `*Добавлена роль "${ROLES_DESCR.get(role) || role}*"`,
            ReplyMarkup.parseModeV2
          )
        } else {
          await ctx.reply(
            `*Не удалось добавить роль "${ROLES_DESCR.get(role) || role}*"`,
            ReplyMarkup.parseModeV2
          )
        }
      }

      return result
        ? {
            goToFromTheTop: true,
            goTo: MENU_ITEM_TYPES.USERS,
          }
        : undefined
    }
  },
}

export default userAddRole
