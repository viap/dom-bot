import assert from "node:assert/strict"
import { afterEach, describe, it, mock } from "node:test"
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

type ListenerInternals = typeof NotificationListener & {
  bot: unknown
  sessions: unknown
  socket: unknown
  isStarted: boolean
  isConnected: boolean
  pollingDelay: number
  pollingTimeout?: NodeJS.Timeout
  didWarnAboutMissingAckTimeout: boolean
  lifecycleGeneration: number
  connectGeneration: number
  isPolling: boolean
  getPollingDelay: (paramDelay?: number) => number
  emitWithAck: <T>(message: string, data?: unknown) => Promise<T> | undefined
  getActiveNotifications: () => Promise<Array<unknown>>
  makeEffect: (notification: unknown) => Promise<void>
  scheduleNextPoll: (
    lifecycleGeneration: number,
    connectGeneration: number
  ) => void
  onConnect: () => Promise<void>
  onDisconnect: () => Promise<void>
}

type FakeSocket = {
  io: {
    on: (event: string, handler: (...args: Array<unknown>) => void) => void
    off: (event: string, handler: (...args: Array<unknown>) => void) => void
    emitLocal: (event: string, ...args: Array<unknown>) => void
  }
  on: (event: string, handler: (...args: Array<unknown>) => void) => void
  off: (event: string, handler: (...args: Array<unknown>) => void) => void
  emitLocal: (event: string, ...args: Array<unknown>) => void
  disconnect: () => void
  disconnected: boolean
}

const listener = NotificationListener as unknown as ListenerInternals
const originalGetActiveNotifications = listener.getActiveNotifications
const originalMakeEffect = listener.makeEffect
const originalEnv = {
  API_WEBSOCKET_URL: process.env.API_WEBSOCKET_URL,
  POLING_DELAY: process.env.POLING_DELAY,
}
const ignoredDelayEnv = "POLL" + "ING_DELAY"

afterEach(() => {
  mock.timers.reset()
  NotificationListener.stop()
  listener.getActiveNotifications = originalGetActiveNotifications
  listener.makeEffect = originalMakeEffect
  listener.didWarnAboutMissingAckTimeout = false
  restoreEnv("API_WEBSOCKET_URL", originalEnv.API_WEBSOCKET_URL)
  restoreEnv("POLING_DELAY", originalEnv.POLING_DELAY)
  delete process.env[ignoredDelayEnv]
})

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

  it("claims notifications before sending them to Telegram", async () => {
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

    assert.deepEqual(calls, ["receipt", "send"])
    assert.deepEqual(notification.received, ["user-1"])
  })

  it("skips Telegram delivery when the notification was already claimed", async () => {
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
            sendMessage: () => Promise<unknown>
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
        return false
      },
    }

    await (
      NotificationListener as unknown as {
        makeEffect: (notification: unknown) => Promise<void>
      }
    ).makeEffect(notification)

    assert.deepEqual(calls, ["receipt"])
    assert.deepEqual(notification.received, [])
  })

  it("warns once when ACK timeout support is missing from the socket", async () => {
    const warnings: Array<unknown> = []
    const originalConsoleWarn = console.warn
    console.warn = (...args: Array<unknown>) => {
      warnings.push(args)
    }
    listener.didWarnAboutMissingAckTimeout = false

    ;(
      NotificationListener as unknown as {
        socket: {
          emitWithAck: (message: string, data?: unknown) => Promise<boolean>
        }
      }
    ).socket = {
      emitWithAck: async () => true,
    }

    try {
      await listener.emitWithAck<boolean>("notifications/test")
      await listener.emitWithAck<boolean>("notifications/test")
    } finally {
      console.warn = originalConsoleWarn
    }

    assert.equal(warnings.length, 1)
    assert.match(
      String((warnings[0] as Array<unknown>)[0]),
      /socket timeout\(\) is not available/
    )
  })
})

describe("NotificationListener polling lifecycle", () => {
  it("does not overlap when batch fetch is slower than the polling delay", async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 })

    let resolveFetch: (notifications: Array<unknown>) => void = () => undefined
    const starts: Array<number> = []
    listener.getActiveNotifications = async () => {
      starts.push(Date.now())
      return new Promise((resolve) => {
        resolveFetch = resolve
      })
    }
    listener.makeEffect = async () => undefined
    const { lifecycleGeneration, connectGeneration } = preparePollingState()

    listener.scheduleNextPoll(lifecycleGeneration, connectGeneration)
    mock.timers.tick(5000)
    await flushPromises()
    mock.timers.tick(5000)
    await flushPromises()

    assert.deepEqual(starts, [5000])

    resolveFetch([])
    await flushPromises()
    mock.timers.tick(4999)
    await flushPromises()
    assert.deepEqual(starts, [5000])

    mock.timers.tick(1)
    await flushPromises()
    assert.deepEqual(starts, [5000, 15000])
  })

  it("does not overlap when notification processing is slower than the polling delay", async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 })

    let resolveProcessing: () => void = () => undefined
    const cycleStarts: Array<number> = []
    const processingStarts: Array<number> = []
    listener.getActiveNotifications = async () => {
      cycleStarts.push(Date.now())
      return [{ _id: "notification-1" }]
    }
    listener.makeEffect = async () => {
      processingStarts.push(Date.now())
      await new Promise<void>((resolve) => {
        resolveProcessing = resolve
      })
    }
    const { lifecycleGeneration, connectGeneration } = preparePollingState()

    listener.scheduleNextPoll(lifecycleGeneration, connectGeneration)
    mock.timers.tick(5000)
    await flushPromises()
    mock.timers.tick(5000)
    await flushPromises()

    assert.deepEqual(cycleStarts, [5000])
    assert.deepEqual(processingStarts, [5000])

    resolveProcessing()
    await flushPromises()
    mock.timers.tick(5000)
    await flushPromises()

    assert.deepEqual(cycleStarts, [5000, 15000])
  })

  it("does not reschedule after stop during an in-flight cycle", async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 })

    let resolveFetch: (notifications: Array<unknown>) => void = () => undefined
    const starts: Array<number> = []
    listener.getActiveNotifications = async () => {
      starts.push(Date.now())
      return new Promise((resolve) => {
        resolveFetch = resolve
      })
    }
    listener.makeEffect = async () => undefined
    const { lifecycleGeneration, connectGeneration } = preparePollingState()

    listener.scheduleNextPoll(lifecycleGeneration, connectGeneration)
    mock.timers.tick(5000)
    await flushPromises()
    NotificationListener.stop()
    resolveFetch([])
    await flushPromises()
    mock.timers.tick(60000)
    await flushPromises()

    assert.deepEqual(starts, [5000])
  })

  it("does not let an old cycle revive after disconnect and reconnect", async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 })

    const resolvers: Array<(notifications: Array<unknown>) => void> = []
    const starts: Array<number> = []
    listener.getActiveNotifications = async () => {
      starts.push(Date.now())
      return new Promise((resolve) => {
        resolvers.push(resolve)
      })
    }
    listener.makeEffect = async () => undefined
    const { lifecycleGeneration, connectGeneration } = preparePollingState()

    listener.scheduleNextPoll(lifecycleGeneration, connectGeneration)
    mock.timers.tick(5000)
    await flushPromises()
    await listener.onDisconnect()
    await listener.onConnect()

    resolvers[0]([])
    await flushPromises()
    mock.timers.tick(4999)
    await flushPromises()
    assert.deepEqual(starts, [5000])

    mock.timers.tick(1)
    await flushPromises()
    assert.deepEqual(starts, [5000, 10000])
  })

  it("schedules a fresh cycle after reconnect without waiting for a stale fetch", async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 })

    const starts: Array<number> = []
    listener.getActiveNotifications = async () => {
      starts.push(Date.now())
      return new Promise(() => undefined)
    }
    listener.makeEffect = async () => undefined
    const { lifecycleGeneration, connectGeneration } = preparePollingState()

    listener.scheduleNextPoll(lifecycleGeneration, connectGeneration)
    mock.timers.tick(5000)
    await flushPromises()
    await listener.onDisconnect()
    await listener.onConnect()

    mock.timers.tick(4999)
    await flushPromises()
    assert.deepEqual(starts, [5000])

    mock.timers.tick(1)
    await flushPromises()
    assert.deepEqual(starts, [5000, 10000])
  })

  it("does not let stale cycle cleanup clear a newer in-flight cycle", async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 })

    const resolvers: Array<(notifications: Array<unknown>) => void> = []
    const starts: Array<number> = []
    listener.getActiveNotifications = async () => {
      starts.push(Date.now())
      return new Promise((resolve) => {
        resolvers.push(resolve)
      })
    }
    listener.makeEffect = async () => undefined
    const { lifecycleGeneration, connectGeneration } = preparePollingState()

    listener.scheduleNextPoll(lifecycleGeneration, connectGeneration)
    mock.timers.tick(5000)
    await flushPromises()
    await listener.onDisconnect()
    await listener.onConnect()
    mock.timers.tick(5000)
    await flushPromises()

    assert.deepEqual(starts, [5000, 10000])

    resolvers[0]([])
    await flushPromises()
    mock.timers.tick(5000)
    await flushPromises()
    assert.deepEqual(starts, [5000, 10000])

    resolvers[1]([])
    await flushPromises()
    mock.timers.tick(4999)
    await flushPromises()
    assert.deepEqual(starts, [5000, 10000])

    mock.timers.tick(1)
    await flushPromises()
    assert.deepEqual(starts, [5000, 10000, 20000])
  })

  it("continues processing later notifications when one notification throws", async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 })

    const processed: Array<string> = []
    const originalConsoleError = console.error
    console.error = () => undefined
    listener.getActiveNotifications = async () => [
      { _id: "notification-1" },
      { _id: "notification-2" },
      { _id: "notification-3" },
    ]
    listener.makeEffect = async (notification) => {
      const id = (notification as { _id: string })._id
      processed.push(id)
      if (id === "notification-1") {
        throw new Error("bad notification")
      }
    }
    const { lifecycleGeneration, connectGeneration } = preparePollingState()

    try {
      listener.scheduleNextPoll(lifecycleGeneration, connectGeneration)
      mock.timers.tick(5000)
      await flushPromises()
    } finally {
      console.error = originalConsoleError
    }

    assert.deepEqual(processed, [
      "notification-1",
      "notification-2",
      "notification-3",
    ])
  })

  it("waits before retrying after a batch ACK error", async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 })

    const starts: Array<number> = []
    const originalConsoleError = console.error
    console.error = () => undefined
    listener.getActiveNotifications = async () => {
      starts.push(Date.now())
      if (starts.length === 1) {
        throw new Error("ack timeout")
      }
      return []
    }
    listener.makeEffect = async () => undefined
    const { lifecycleGeneration, connectGeneration } = preparePollingState()

    try {
      listener.scheduleNextPoll(lifecycleGeneration, connectGeneration)
      mock.timers.tick(5000)
      await flushPromises()
      mock.timers.tick(4999)
      await flushPromises()
    } finally {
      console.error = originalConsoleError
    }
    assert.deepEqual(starts, [5000])

    mock.timers.tick(1)
    await flushPromises()
    assert.deepEqual(starts, [5000, 10000])
  })

  it("creates one active loop across repeated start and connect calls", async () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 })

    const sockets: Array<FakeSocket> = []
    const starts: Array<number> = []
    listener.getActiveNotifications = async () => {
      starts.push(Date.now())
      return []
    }
    listener.makeEffect = async () => undefined
    process.env.API_WEBSOCKET_URL = "ws://localhost:3004"

    await NotificationListener.start({} as never, {} as never, {
      pollingDelay: 5000,
      socketFactory: (() => {
        const socket = createFakeSocket()
        sockets.push(socket)
        return socket
      }) as never,
    })
    await NotificationListener.start({} as never, {} as never, {
      pollingDelay: 5000,
      socketFactory: (() => createFakeSocket()) as never,
    })

    sockets[0].emitLocal("connect")
    sockets[0].emitLocal("connect")
    mock.timers.tick(5000)
    await flushPromises()

    assert.equal(sockets.length, 1)
    assert.deepEqual(starts, [5000])
  })

  it("allows start after stop and after terminal reconnect failure", async () => {
    const sockets: Array<FakeSocket> = []
    process.env.API_WEBSOCKET_URL = "ws://localhost:3004"

    await NotificationListener.start({} as never, {} as never, {
      pollingDelay: 5000,
      socketFactory: (() => {
        const socket = createFakeSocket()
        sockets.push(socket)
        return socket
      }) as never,
    })
    NotificationListener.stop()
    await NotificationListener.start({} as never, {} as never, {
      pollingDelay: 5000,
      socketFactory: (() => {
        const socket = createFakeSocket()
        sockets.push(socket)
        return socket
      }) as never,
    })
    sockets[1].io.emitLocal("reconnect_failed")
    await NotificationListener.start({} as never, {} as never, {
      pollingDelay: 5000,
      socketFactory: (() => {
        const socket = createFakeSocket()
        sockets.push(socket)
        return socket
      }) as never,
    })

    assert.equal(sockets.length, 3)
    assert.equal(sockets[0].disconnected, true)
    assert.equal(sockets[1].disconnected, true)
    assert.equal(sockets[2].disconnected, false)
  })

  it("uses POLING_DELAY as the polling delay environment variable", () => {
    process.env.POLING_DELAY = "7000"

    assert.equal(listener.getPollingDelay(), 7000)
  })

  it("ignores the alternate polling delay spelling", () => {
    process.env[ignoredDelayEnv] = "6000"

    assert.equal(listener.getPollingDelay(), 30000)
  })

  it("uses safe delay values for invalid and too-small POLING_DELAY", () => {
    delete process.env[ignoredDelayEnv]
    process.env.POLING_DELAY = "nope"
    assert.equal(listener.getPollingDelay(), 30000)

    process.env.POLING_DELAY = "100"
    assert.equal(listener.getPollingDelay(), 5000)
  })
})

function preparePollingState() {
  NotificationListener.stop()
  listener.isStarted = true
  listener.isConnected = true
  listener.isPolling = false
  listener.pollingDelay = 5000
  listener.lifecycleGeneration += 1
  listener.connectGeneration += 1

  return {
    lifecycleGeneration: listener.lifecycleGeneration,
    connectGeneration: listener.connectGeneration,
  }
}

function createFakeSocket(): FakeSocket {
  const socketHandlers = new Map<
    string,
    Array<(...args: Array<unknown>) => void>
  >()
  const managerHandlers = new Map<
    string,
    Array<(...args: Array<unknown>) => void>
  >()

  return {
    io: createHandlerRegistry(managerHandlers),
    ...createHandlerRegistry(socketHandlers),
    disconnected: false,
    disconnect() {
      this.disconnected = true
    },
  }
}

function createHandlerRegistry(
  handlers: Map<string, Array<(...args: Array<unknown>) => void>>
) {
  return {
    on(event: string, handler: (...args: Array<unknown>) => void) {
      handlers.set(event, [...(handlers.get(event) || []), handler])
    },
    off(event: string, handler: (...args: Array<unknown>) => void) {
      handlers.set(
        event,
        (handlers.get(event) || []).filter((item) => item !== handler)
      )
    },
    emitLocal(event: string, ...args: Array<unknown>) {
      for (const handler of handlers.get(event) || []) {
        handler(...args)
      }
    },
  }
}

function restoreEnv(key: keyof typeof originalEnv, value?: string) {
  if (value === undefined) {
    delete process.env[key]
  } else {
    process.env[key] = value
  }
}

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}
