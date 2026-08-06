import assert from "node:assert/strict"
import { describe, it } from "node:test"
import NotificationListener from "./notificationListener"

const broadcastMessage = `Здравствуйте! 👋

Хотим напомнить, пожалуйста, отмечайте в боте информацию о проведённых встречах с клиентами.

После каждой сессии нужно зайти в раздел «Мо клиенты» и отметить встречу у соответствующего клиента.

Например:
«Мои клиенты» → «Список клиентов» → Выбрать соответствующего клиента → «Добавить сессию»

Эти данные помогают нам корректно вести статистику работы центра и лучше понимать общую динамику обращений и встреч.

Полная инструкция по внесению информации доступна по ссылке:
https://docs.google.com/presentation/d/1bpbpc5ipIrwF0QZY2E4XWddTmAkz6Cg2Lb4x8UjQK00/edit?usp=drive_link

Спасибо за вашу помощь и внимательность! 💛`

describe("NotificationListener message delivery", () => {
  it("builds the full broadcast message with the raw URL entity", () => {
    const url =
      "https://docs.google.com/presentation/d/1bpbpc5ipIrwF0QZY2E4XWddTmAkz6Cg2Lb4x8UjQK00/edit?usp=drive_link"
    const messageOffset = broadcastMessage.indexOf(url)
    const result = (
      NotificationListener as unknown as {
        buildMessageNotification: (notification: unknown) => {
          text: string
          options: { entities?: Array<unknown> }
        }
      }
    ).buildMessageNotification({
      type: "message",
      message: broadcastMessage,
      messageEntities: [
        {
          type: "url",
          offset: messageOffset,
          length: url.length,
        },
      ],
      roles: [],
      recipients: [],
      received: [],
    })

    assert.equal(result.text, broadcastMessage)
    assert.deepEqual(result.options.entities, [
      {
        type: "url",
        offset: messageOffset,
        length: url.length,
      },
    ])
  })

  it("retries rich messages as plain text when Telegram rejects entities", async () => {
    const calls: Array<{ chatId: string; text: string; options?: unknown }> = []
    const error = new Error("Bad Request: can't parse entities")
    const originalConsoleError = console.error
    console.error = () => undefined

    ;(
      NotificationListener as unknown as {
        bot: {
          api: {
            sendMessage: (
              chatId: string,
              text: string,
              options?: unknown
            ) => Promise<unknown>
          }
        }
        sendTelegramMessage: (
          chatId: string,
          message: { text: string; options: { [key: string]: unknown } }
        ) => Promise<unknown>
      }
    ).bot = {
      api: {
        sendMessage: async (chatId, text, options) => {
          calls.push({ chatId, text, options })
          if (calls.length === 1) {
            throw error
          }
          return { message_id: 1 }
        },
      },
    }

    try {
      await (
        NotificationListener as unknown as {
          sendTelegramMessage: (
            chatId: string,
            message: { text: string; options: { [key: string]: unknown } }
          ) => Promise<unknown>
        }
      ).sendTelegramMessage("123", {
        text: broadcastMessage,
        options: {
          entities: [{ type: "url", offset: 493, length: 103 }],
        },
      })
    } finally {
      console.error = originalConsoleError
    }

    assert.deepEqual(calls, [
      {
        chatId: "123",
        text: broadcastMessage,
        options: {
          entities: [{ type: "url", offset: 493, length: 103 }],
        },
      },
      {
        chatId: "123",
        text: broadcastMessage,
        options: undefined,
      },
    ])
  })

  it("marks notifications as received only after Telegram accepts the message", async () => {
    const calls: Array<string> = []
    const tokenPayload = Buffer.from(
      JSON.stringify({ userId: "user-1", roles: [] })
    ).toString("base64url")
    const token = `header.${tokenPayload}.signature`
    const notification = {
      _id: "notification-1",
      type: "message",
      message: broadcastMessage,
      messageEntities: [],
      roles: [],
      recipients: [],
      received: [],
    }

    ;(
      NotificationListener as unknown as {
        bot: {
          api: {
            sendMessage: (
              chatId: string,
              text: string,
              options?: unknown
            ) => Promise<unknown>
          }
        }
        sessions: {
          find: () => {
            hasNext: () => Promise<boolean>
            next: () => Promise<unknown>
            rewind: () => void
          }
        }
        socket: {
          emitWithAck: (message: string, data?: unknown) => Promise<boolean>
        }
        makeEffect: (notification: unknown) => Promise<void>
      }
    ).bot = {
      api: {
        sendMessage: async () => {
          calls.push("send")
          return { message_id: 1 }
        },
      },
    }
    ;(
      NotificationListener as unknown as {
        sessions: {
          find: () => {
            hasNext: () => Promise<boolean>
            next: () => Promise<unknown>
            rewind: () => void
          }
        }
      }
    ).sessions = {
      find: () => {
        let consumed = false
        return {
          hasNext: async () => !consumed,
          next: async () => {
            consumed = true
            return { key: "bot/chat-1", value: { token } }
          },
          rewind: () => undefined,
        }
      },
    }
    ;(
      NotificationListener as unknown as {
        socket: {
          emitWithAck: (message: string, data?: unknown) => Promise<boolean>
        }
      }
    ).socket = {
      emitWithAck: async () => {
        calls.push("receipt")
        return true
      },
    }

    await (
      NotificationListener as unknown as {
        makeEffect: (notification: unknown) => Promise<void>
      }
    ).makeEffect(notification)

    assert.deepEqual(calls, ["send", "receipt"])
    assert.deepEqual(notification.received, ["user-1"])
  })
})
