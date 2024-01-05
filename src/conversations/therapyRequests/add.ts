import { Conversation } from "@grammyjs/conversations"
import { getAllPsychologists } from "../../api/controllerPsychologists/getAllPsychologists"
import { createTherapyRequest } from "../../api/controllerTherapyRequests/createTherapyRequest"
import { TelegramUserDto } from "../../common/dto/telegramUser.dto"
import { BOT_ERRORS } from "../../common/enums/botErrors"
import { ROLES } from "../../common/enums/roles"
import { SocialNetworks } from "../../common/enums/socialNetworks"
import { MyContext } from "../../common/types/myContext"
import { notEmpty } from "../../common/utils/notEmpty"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { FORM_INPUT_TYPES } from "../../components/Form/enums/formInputTypes"
import { FORM_RESULT_STATUSES } from "../../components/Form/enums/formResultStatuses"
import { Form } from "../../components/Form/form"
import { FormInputProps } from "../../components/Form/types/formInputProps"
import { CONVERSATION_NAMES } from "../enums/conversationNames"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

const therapyRequestAdd: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_REQUEST_ADD
  },

  getConversation() {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult | undefined> => {
      const allPsychologists = await getAllPsychologists(ctx)
      const telegramUser: TelegramUserDto | undefined =
        ctx.from && !ctx.from.is_bot
          ? {
              ...ctx.from,
              id: ctx.from.id + "",
            }
          : undefined

      if (!(ctx.user && telegramUser)) {
        await ctx.reply(
          "*Не возможно отправить заявку*",
          ReplyMarkup.parseModeV2
        )
        return
      }

      const inputs: Array<FormInputProps> = [
        {
          name: "name",
          alias: "имя",
          type: FORM_INPUT_TYPES.STRING,
        },
        {
          name: "descr",
          alias: "запрос",
          type: FORM_INPUT_TYPES.STRING,
        },
        {
          name: "psychologist",
          alias: "психолога",
          type: FORM_INPUT_TYPES.SELECT,
          optional: true,
          values: allPsychologists.map((psychologist) => {
            return {
              text: psychologist.user.name,
              value: psychologist._id,
            }
          }),
        },
        ctx.user.roles.includes(ROLES.EDITOR) ||
        ctx.user.roles.includes(ROLES.ADMIN) ||
        ctx.user.roles.includes(ROLES.PSYCHOLOGIST)
          ? {
              name: "telegramUser",
              alias: "логин в телеграм",
              type: FORM_INPUT_TYPES.STRING,
              optional: true,
            }
          : undefined,
      ].filter(notEmpty) as Array<FormInputProps>

      type resultType = {
        name: string
        descr: string
        psychologist?: string
        telegramUser?: string
      }
      const form = new Form<resultType>(conversation, ctx, inputs)
      const formResult = await form.requestData()

      if (formResult.status === FORM_RESULT_STATUSES.FINISHED) {
        let result = false
        const enteredTelegramUser = (formResult.data.telegramUser || "")
          .trim()
          .replace("@", "")

        try {
          result = telegramUser
            ? await conversation.external(async () => {
                return notEmpty(
                  await createTherapyRequest(ctx, {
                    name:
                      formResult.data.name ||
                      [telegramUser.last_name, telegramUser.first_name]
                        .filter(notEmpty)
                        .join(" ") ||
                      telegramUser.username ||
                      "",
                    descr: formResult.data.descr,
                    user: ctx.user._id,
                    psychologist: formResult.data.psychologist,
                    contacts: [
                      {
                        id: enteredTelegramUser ? undefined : telegramUser.id,
                        network: SocialNetworks.Telegram,
                        username:
                          enteredTelegramUser || telegramUser.username || "",
                      },
                    ],
                  })
                )
              })
            : false
        } catch (e) {
          conversation.log(BOT_ERRORS.REQUEST, e)
        } finally {
          if (result) {
            await ctx.reply("*Ваш запрос отправлен*", ReplyMarkup.parseModeV2)
          } else {
            await ctx.reply(
              "*Не удалось отправить запрос*",
              ReplyMarkup.parseModeV2
            )
          }
        }
      }
    }
  },
}

export default therapyRequestAdd
