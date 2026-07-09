import { getAllPsychologists } from "@/api/controllerPsychologists/getAllPsychologists"
import { createTherapyRequest } from "@/api/controllerTherapyRequests/createTherapyRequest"
import {
  clientGenderOptions,
  isTherapyRequestCategory,
  isTherapyRequestClientGender,
  requestCategoryOptions,
} from "@/common/consts/therapyRequestAnalytics"
import { TelegramUserDto } from "@/common/dto/telegramUser.dto"
import { BOT_ERRORS } from "@/common/enums/botErrors"
import { SocialNetworks } from "@/common/enums/socialNetworks"
import { MyContext } from "@/common/types/myContext"
import { notEmpty } from "@/common/utils/notEmpty"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import { FORM_INPUT_TYPES } from "@/components/Form/enums/formInputTypes"
import { FORM_RESULT_STATUSES } from "@/components/Form/enums/formResultStatuses"
import { createForm } from "@/components/Form/form"
import { Conversation } from "@grammyjs/conversations"
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

      const sessionUser = ctx.session.user

      if (!sessionUser || !telegramUser) {
        await ctx.reply(
          "*Не возможно отправить заявку*",
          ReplyMarkup.parseModeV2
        )

        return
      }

      const inputs = [
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
          name: "clientGender",
          alias: "пол клиента",
          type: FORM_INPUT_TYPES.SELECT,
          optional: true,
          values: clientGenderOptions,
        },
        {
          name: "requestCategory",
          alias: "категорию запроса",
          type: FORM_INPUT_TYPES.SELECT,
          optional: true,
          values: requestCategoryOptions,
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
        {
          name: "telegramUser",
          alias: "логин в телеграм",
          type: FORM_INPUT_TYPES.STRING,
          optional: true,
        },
      ] as const

      const form = createForm(conversation, ctx, inputs)
      const formResult = await form.requestData()

      if (formResult.status === FORM_RESULT_STATUSES.FINISHED) {
        let result = false
        const enteredTelegramUser = (formResult.data.telegramUser || "")
          .trim()
          .replace("@", "")

        try {
          result = await conversation.external(async () => {
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
                user: sessionUser._id,
                psychologist:
                  typeof formResult.data.psychologist === "string"
                    ? formResult.data.psychologist
                    : undefined,
                clientGender:
                  isTherapyRequestClientGender(formResult.data.clientGender)
                    ? formResult.data.clientGender
                    : undefined,
                requestCategory:
                  isTherapyRequestCategory(formResult.data.requestCategory)
                    ? formResult.data.requestCategory
                    : undefined,
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
        } catch (e) {
          conversation.log(BOT_ERRORS.REQUEST, e)
        } finally {
          if (result === true) {
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
