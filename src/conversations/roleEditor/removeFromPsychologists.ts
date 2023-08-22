import { Conversation } from "@grammyjs/conversations"
import { editUser } from "../../api/controllerUsers/editUser"
import { UserDto } from "../../common/dto/user.dto"
import { BOT_ERRORS } from "../../common/enums/botErrors.enum"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "../enums/conversationNames.enum"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"
import { EditUserDto } from "../../api/dto/editUser.dto"
import { ROLES } from "../../common/enums/roles.enum"

export const RemoveFromPsychologists: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.PSYCHOLOGIST_TO_USER
  },

  getConversation(user: UserDto) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      let result = false

      try {
        result = !!(await conversation.external(async () => {
          return await editUser(ctx, user._id, {
            roles: user.roles.filter((role) => role !== ROLES.PSYCHOLOGIST),
          } as EditUserDto)
        }))
      } catch (e) {
        conversation.log(BOT_ERRORS.REQUEST, e)
      } finally {
        if (result) {
          await ctx.reply("*Удалены права психолога*", ReplyMarkup.parseModeV2)
        } else {
          await ctx.reply(
            "*Не удалось удалить права психолога*",
            ReplyMarkup.parseModeV2
          )
        }
      }

      return result
        ? {
            stepsBack: 2,
          }
        : undefined
    }
  },
}
