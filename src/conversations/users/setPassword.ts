import { editUser } from "@/api/controllerUsers/editUser"
import { EditUserDto } from "@/api/dto/editUser.dto"
import { UserDto } from "@/common/dto/user.dto"
import { BOT_ERRORS } from "@/common/enums/botErrors"
import { MyContext } from "@/common/types/myContext"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { FORM_INPUT_TYPES } from "@/components/Form/enums/formInputTypes"
import { FORM_RESULT_STATUSES } from "@/components/Form/enums/formResultStatuses"
import { createForm } from "@/components/Form/form"
import { Conversation } from "@grammyjs/conversations"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

const userSetPassword: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.USER_SET_PASSWORD
  },

  getConversation(user: UserDto) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      const inputs = [
        {
          name: "password",
          alias: "пароль",
          type: FORM_INPUT_TYPES.STRING,
          owner: user.name,
        },
      ] as const

      const form = createForm(conversation, ctx, inputs)
      const formResult = await form.requestData()

      if (formResult.status === FORM_RESULT_STATUSES.FINISHED) {
        let result = false

        try {
          const editedUser = (await conversation.external(async () => {
            return await editUser(ctx, user._id, {
              password: formResult.data.password,
            })
          })) as EditUserDto

          result = typeof editedUser === "object"
        } catch (e) {
          conversation.log(BOT_ERRORS.REQUEST, e)
        } finally {
          if (result === true) {
            await ctx.reply(
              "*Пароль пользователя изменен*",
              ReplyMarkup.parseModeV2
            )
          } else {
            await ctx.reply(
              "*Не удалось изменить пароль пользователя*",
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
    }
  },
}

export default userSetPassword
