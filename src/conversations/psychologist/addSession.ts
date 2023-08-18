import { Conversation } from "@grammyjs/conversations"
import { addTherapySession } from "../../api/addTherapySession"
import { currentUserAlias } from "../../common/consts/currentUserAlias"
import { numberOfCommissionHours } from "../../common/consts/numberOfCommissionHours"
import { ClientDto } from "../../common/dto/client.dto"
import { TherapySessionDto } from "../../common/dto/therapySession.dto"
import { BOT_ERRORS } from "../../common/enums/botErrors.enum"
import { CURRENCIES } from "../../common/enums/currencies.enum"
import { MyContext } from "../../common/types/myContext"
import { ReplyMarkup } from "../../common/utils/replyMarkup"
import { FORM_INPUT_TYPES } from "../../components/Form/enums/formInputTypes.enum"
import { FORM_RESULT_STATUSES } from "../../components/Form/enums/formResultStatuses.enum"
import { Form } from "../../components/Form/form"
import { FormInputProps } from "../../components/Form/types/formInputProps"
import { getClientMenuItem } from "../../components/MenuBlock/submenus/getClientsMenuItems"
import { CONVERSATION_NAMES } from "../enums/conversationNames.enum"
import { BotConversation } from "../types/botConversation"
import { ConversationResult } from "../types/conversationResult"

export const addSession: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.THERAPY_SESSION_ADD
  },

  getConversation(client: ClientDto, sessions: Array<TherapySessionDto>) {
    return async (
      conversation: Conversation<MyContext>,
      ctx: MyContext
    ): Promise<ConversationResult> => {
      // NOTICE: duration in minutes
      const hoursSpent =
        sessions.reduce((acc, session) => {
          acc += session.duration
          return acc
        }, 0) / 60

      const inputs: Array<FormInputProps> = [
        // {
        //   name: "date",
        //   alias: "Дата",
        //   type: FORM_INPUT_TYPES.STRING,
        // },
        {
          name: "descr",
          alias: "Описание",
          type: FORM_INPUT_TYPES.STRING,
          optional: true,
        },
        {
          name: "duration",
          alias: "Продолжительность",
          type: FORM_INPUT_TYPES.SELECT,
          values: [
            { text: "один час", value: 60 },
            { text: "полтора часа", value: 90 },
            { text: "два часа", value: 120 },
          ],
        },
        {
          name: "priceCurrency",
          alias: "Цена (Валюта)",
          type: FORM_INPUT_TYPES.SELECT,
          values: Object.values(CURRENCIES),
        },
        {
          name: "priceValue",
          alias: "Цена (Сумма)",
          type: FORM_INPUT_TYPES.FLOAT,
        },
      ]

      if (hoursSpent < numberOfCommissionHours) {
        inputs.push(
          {
            name: "comissionCurrency",
            alias: `Комиссия (Валюта)`, // (проведено ${hoursSpent} из ${numberOfCommissionHours} часов)
            type: FORM_INPUT_TYPES.SELECT,
            values: Object.values(CURRENCIES),
          },
          {
            name: "comissionValue",
            alias: "Комиссия (Сумма)",
            type: FORM_INPUT_TYPES.FLOAT,
          }
        )
      }

      type resultType = {
        // date: string
        descr: string
        duration: number
        priceCurrency: CURRENCIES
        priceValue: number
        comissionCurrency: CURRENCIES
        comissionValue: number
      }
      const form = new Form<resultType>(conversation, ctx, inputs)
      const formResult = await form.requestData()

      const resultSessions = [...sessions]
      if (formResult.status === FORM_RESULT_STATUSES.FINISHED) {
        let result = false
        try {
          result = await conversation.external(async () => {
            const session = await addTherapySession(ctx, {
              date: new Date().toLocaleDateString(),
              psychologist: currentUserAlias,
              client: client.user._id,
              duration: formResult.data.duration,
              price: {
                currency: formResult.data.priceCurrency,
                value: formResult.data.priceValue,
              },
              comission: {
                currency: formResult.data.comissionCurrency,
                value: formResult.data.comissionValue,
              },
              descr: formResult.data.descr || undefined,
            })

            if (session) {
              resultSessions.push(session)
            }

            return !!session
          })
        } catch (e) {
          conversation.log(BOT_ERRORS.REQUEST, e)
        } finally {
          if (result) {
            await ctx.reply("*Добавлена сессия*", ReplyMarkup.parseModeV2)
          } else {
            await ctx.reply(
              "*Не удалось добавить сессию*",
              ReplyMarkup.parseModeV2
            )
          }
        }
      }

      // conversation.log("resultSessions", resultSessions.length)
      // conversation.log("client", client)
      // conversation.log(
      //   "getClientMenuItem(client, resultSessions)",
      //   getClientMenuItem(client, resultSessions)
      // )

      // FIXME: goto => parent.name makes some problem
      // on click "Список сессий" menu goes to the top because it can't find required item in current
      const parent = getClientMenuItem(client, resultSessions)
      return {
        parent,
        goTo: parent.name,
        goToFromTheTop: true,
      }
    }
  },
}
