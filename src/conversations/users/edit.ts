import { Conversation } from "@grammyjs/conversations"
import { editUser } from "../../api/controllerUsers/editUser"
import { UserDto } from "../../common/dto/user.dto"
import { BOT_ERRORS } from "../../common/enums/botErrors"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { FORM_INPUT_TYPES } from "../../components/Form/enums/formInputTypes"
import { FORM_RESULT_STATUSES } from "../../components/Form/enums/formResultStatuses"
import { Form } from "../../components/Form/form"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

const userEdit: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.USER_EDIT
  },

  getConversation(user: UserDto) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      const inputs = [
        {
          name: "name",
          alias: "имя",
          type: FORM_INPUT_TYPES.STRING,
          owner: user.name,
        },
        {
          name: "descr",
          alias: "описание",
          type: FORM_INPUT_TYPES.STRING,
          owner: user.name,
          optional: true,
        },
      ]
      type resultType = { name: string; descr: string }
      const form = new Form<resultType>(conversation, ctx, inputs)
      const formResult = await form.requestData()

      const userResult = { ...user }
      if (formResult.status === FORM_RESULT_STATUSES.FINISHED) {
        let result = false
        try {
          result = await conversation.external(async () => {
            return await editUser(ctx, user._id, {
              name: formResult.data.name,
              descr: formResult.data.descr,
            })
          })
        } catch (e) {
          conversation.log(BOT_ERRORS.REQUEST, e)
        } finally {
          if (result) {
            Object.assign(userResult, formResult.data)
            await ctx.reply(
              "*Данные пользователя изменены*",
              ReplyMarkup.parseModeV2
            )
          } else {
            await ctx.reply(
              "*Не удалось изменить данные пользователя*",
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

export default userEdit
