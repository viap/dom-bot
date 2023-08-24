import { Conversation } from "@grammyjs/conversations"
import { createPsychologistFromUser } from "../../api/controllerPsychologists/createPsychologistFromUser"
import { UserDto } from "../../common/dto/user.dto"
import { BOT_ERRORS } from "../../common/enums/botErrors.enum"
import { MyContext } from "../../common/types/myContext"
import { notEmpty } from "../../common/utils/notEmpty"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { CONVERSATION_NAMES } from "../enums/conversationNames.enum"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

export const CreatePsychologistFromUser: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.USER_TO_PSYCHOLOGIST
  },

  getConversation(user: UserDto) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      let result = false

      try {
        result = notEmpty(
          await conversation.external(async () => {
            return await createPsychologistFromUser(ctx, { userId: user._id })
          })
        )
      } catch (e) {
        conversation.log(BOT_ERRORS.REQUEST, e)
      } finally {
        if (result) {
          await ctx.reply(
            "*Добавлены права психолога*",
            ReplyMarkup.parseModeV2
          )
        } else {
          await ctx.reply(
            "*Не удалось добавить права психолога*",
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
