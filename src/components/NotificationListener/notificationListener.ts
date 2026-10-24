import { getSafeErrorDetails } from "@/common/utils/getSafeErrorDetails"
import { NotificationDto } from "@/common/dto/notification.dto"
import { TokenPayloadDto } from "@/common/dto/tokenPayload.dto"
import { NOTIFICATION_TYPES } from "@/common/enums/notificationTypes"
import { MyContext } from "@/common/types/myContext"
import { SessionData } from "@/common/types/sessionData"
import { getApiClientHeader } from "@/common/utils/getApiClientHeader"
import {
  offsetNotificationMessageEntities,
  sanitizeNotificationMessageEntities,
} from "@/common/utils/notificationMessageEntities"
import { parseNotificationMessageLinks } from "@/common/utils/parseNotificationMessageLinks"
import { ReplyMarkup } from "@/common/utils/replyMarkup"
import getMenuItemBreadCrumbs from "@/components/MenuBlock/utils/getMenuItemBreadCrumbs"
import * as MongoStorage from "@grammyjs/storage-mongodb"
import { Collection } from "@grammyjs/storage-mongodb/dist/cjs/deps.node"
import type { MessageEntity } from "@grammyjs/types"
import { Api, Bot, InlineKeyboard, RawApi } from "grammy"
import { jwtDecode } from "jwt-decode"
import { io, Socket } from "socket.io-client"
import { MENU_ITEM_TYPES } from "../MenuBlock/enums/menuItemTypes"

type NotificationRecipient = { chatId: string; userId: string }
type SocketFactory = typeof io
type TimeoutSocket = Socket & {
  timeout?: (timeout: number) => Pick<Socket, "emitWithAck">
}

const DEFAULT_POLING_DELAY = 30000
const MIN_POLING_DELAY = 5000
const ACK_TIMEOUT = 30000
const DIAGNOSTICS_LOG_EVERY = 20

export default class NotificationListener {
  private static bot: Bot<MyContext, Api<RawApi>>
  private static sessions: Collection<MongoStorage.ISession>

  private static socket: Socket | undefined
  private static isStarted = false
  private static isConnected = false
  private static pollingTimeout: NodeJS.Timeout | undefined
  private static pollingDelay = DEFAULT_POLING_DELAY
  private static didWarnAboutMissingAckTimeout = false
  private static lifecycleGeneration = 0
  private static connectGeneration = 0
  private static isPolling = false
  private static pollingOwner:
    | { lifecycleGeneration: number; connectGeneration: number }
    | undefined
  private static pendingPollGeneration:
    | { lifecycleGeneration: number; connectGeneration: number }
    | undefined
  private static currentCycleSessionScans = 0
  private static cycleCandidates?: Array<NotificationRecipient>
  private static diagnostics = {
    cycles: 0,
    notifications: 0,
    sessionScans: 0,
    claims: 0,
    sends: 0,
    errors: 0,
    reconnects: 0,
    totalDurationMs: 0,
  }

  static async start(
    bot: Bot<MyContext, Api<RawApi>>,
    sessions: Collection<MongoStorage.ISession>,
    params?: { pollingDelay?: number; socketFactory?: SocketFactory }
  ) {
    if (NotificationListener.isStarted) {
      return
    }

    const wsUrl = process.env.API_WEBSOCKET_URL
    if (!wsUrl) {
      console.error(
        "NotificationListener: API_WEBSOCKET_URL is not set — notifications disabled"
      )
      return
    }

    NotificationListener.bot = bot
    NotificationListener.sessions = sessions
    NotificationListener.pollingDelay = NotificationListener.getPollingDelay(
      params?.pollingDelay
    )
    NotificationListener.isStarted = true
    NotificationListener.isConnected = false
    NotificationListener.isPolling = false
    delete NotificationListener.pollingOwner
    NotificationListener.lifecycleGeneration += 1

    console.info(
      `NotificationListener: effective polling delay is ${NotificationListener.pollingDelay}ms`
    )

    const socketFactory = params?.socketFactory || io
    NotificationListener.socket = socketFactory(wsUrl, {
      transports: ["websocket"],
      autoConnect: true,
      reconnectionDelayMax: 10000,
      extraHeaders: {
        // Authorization: `Bearer ${NotificationListener.ctx.session.token}`,
        Authorization: getApiClientHeader(
          process.env.API_CLIENT_NAME,
          process.env.API_CLIENT_PASSWORD
        ),
      },
    })

    NotificationListener.socket.io.on("error", NotificationListener.onError)
    NotificationListener.socket.on("connect", NotificationListener.onConnect)
    NotificationListener.socket.on("inited", NotificationListener.onInited)
    NotificationListener.socket.on(
      "unauthorized",
      NotificationListener.onUnauthorized
    )
    NotificationListener.socket.on(
      "exception",
      NotificationListener.onException
    )
    NotificationListener.socket.on(
      "disconnect",
      NotificationListener.onDisconnect
    )
  }

  static stop() {
    NotificationListener.lifecycleGeneration += 1
    NotificationListener.connectGeneration += 1
    NotificationListener.isStarted = false
    NotificationListener.isConnected = false
    NotificationListener.isPolling = false
    delete NotificationListener.pollingOwner
    delete NotificationListener.pendingPollGeneration
    NotificationListener.clearPollingTimeout()

    const socket = NotificationListener.socket
    if (socket) {
      socket.io?.off?.("error", NotificationListener.onError)
      socket.off?.("connect", NotificationListener.onConnect)
      socket.off?.("inited", NotificationListener.onInited)
      socket.off?.("unauthorized", NotificationListener.onUnauthorized)
      socket.off?.("exception", NotificationListener.onException)
      socket.off?.("disconnect", NotificationListener.onDisconnect)
      socket.disconnect?.()
      delete NotificationListener.socket
    }
  }

  private static getPollingDelay(paramDelay?: number): number {
    const source =
      paramDelay !== undefined
        ? { name: "params.pollingDelay", value: paramDelay }
        : process.env.POLING_DELAY
        ? { name: "POLING_DELAY", value: Number(process.env.POLING_DELAY) }
        : { name: "default", value: DEFAULT_POLING_DELAY }

    if (!Number.isFinite(source.value)) {
      console.warn(
        `NotificationListener: invalid ${source.name}; using ${DEFAULT_POLING_DELAY}ms`
      )
      return DEFAULT_POLING_DELAY
    }

    const delay = Math.trunc(source.value)
    if (delay < MIN_POLING_DELAY) {
      console.warn(
        `NotificationListener: ${source.name} is below ${MIN_POLING_DELAY}ms; using ${MIN_POLING_DELAY}ms`
      )
      return MIN_POLING_DELAY
    }

    return delay
  }

  private static emitWithAck<T>(
    message: string,
    data?: unknown
  ): Promise<T> | undefined {
    if (NotificationListener.socket) {
      const socket = NotificationListener.socket as TimeoutSocket
      const hasTimeout = typeof socket.timeout === "function"

      if (!hasTimeout && !NotificationListener.didWarnAboutMissingAckTimeout) {
        NotificationListener.didWarnAboutMissingAckTimeout = true
        console.warn(
          "NotificationListener: socket timeout() is not available; ACK timeout is disabled"
        )
      }

      const ackSocket = hasTimeout ? socket.timeout(ACK_TIMEOUT) : socket
      return ackSocket.emitWithAck(message, data) as Promise<T>
    }
  }

  private static clearPollingTimeout() {
    clearTimeout(NotificationListener.pollingTimeout)
    delete NotificationListener.pollingTimeout
  }

  private static shouldPoll(
    lifecycleGeneration: number,
    connectGeneration: number
  ) {
    return (
      NotificationListener.isStarted &&
      NotificationListener.isConnected &&
      NotificationListener.lifecycleGeneration === lifecycleGeneration &&
      NotificationListener.connectGeneration === connectGeneration
    )
  }

  private static ownsPollingCycle(
    lifecycleGeneration: number,
    connectGeneration: number
  ) {
    return (
      NotificationListener.pollingOwner?.lifecycleGeneration ===
        lifecycleGeneration &&
      NotificationListener.pollingOwner?.connectGeneration === connectGeneration
    )
  }

  private static scheduleNextPoll(
    lifecycleGeneration: number,
    connectGeneration: number
  ) {
    if (
      !NotificationListener.shouldPoll(lifecycleGeneration, connectGeneration)
    ) {
      return
    }

    if (NotificationListener.isPolling) {
      NotificationListener.pendingPollGeneration = {
        lifecycleGeneration,
        connectGeneration,
      }
      return
    }

    if (NotificationListener.pollingTimeout) {
      return
    }

    NotificationListener.pollingTimeout = setTimeout(() => {
      delete NotificationListener.pollingTimeout
      void NotificationListener.runPollingCycle(
        lifecycleGeneration,
        connectGeneration
      )
    }, NotificationListener.pollingDelay)
  }

  private static async runPollingCycle(
    lifecycleGeneration: number,
    connectGeneration: number
  ) {
    if (
      NotificationListener.isPolling ||
      !NotificationListener.shouldPoll(lifecycleGeneration, connectGeneration)
    ) {
      return
    }

    NotificationListener.isPolling = true
    NotificationListener.pollingOwner = {
      lifecycleGeneration,
      connectGeneration,
    }
    NotificationListener.currentCycleSessionScans = 0
    delete NotificationListener.cycleCandidates
    const startedAt = Date.now()
    let notificationCount = 0

    try {
      const notifications = await NotificationListener.getActiveNotifications()
      if (
        !NotificationListener.shouldPoll(lifecycleGeneration, connectGeneration)
      ) {
        return
      }

      notificationCount = notifications.length
      for (const notification of notifications) {
        if (
          !NotificationListener.shouldPoll(
            lifecycleGeneration,
            connectGeneration
          )
        ) {
          break
        }
        try {
          await NotificationListener.makeEffect(notification)
        } catch (error) {
          if (
            NotificationListener.ownsPollingCycle(
              lifecycleGeneration,
              connectGeneration
            )
          ) {
            NotificationListener.diagnostics.errors += 1
            console.error(
              "Notification processing error",
              getSafeErrorDetails(error)
            )
          }
        }
      }
    } catch (error) {
      if (
        NotificationListener.ownsPollingCycle(
          lifecycleGeneration,
          connectGeneration
        )
      ) {
        NotificationListener.diagnostics.errors += 1
        console.error(
          "Notifications: polling cycle failed",
          getSafeErrorDetails(error)
        )
      }
    } finally {
      if (
        NotificationListener.ownsPollingCycle(
          lifecycleGeneration,
          connectGeneration
        )
      ) {
        NotificationListener.isPolling = false
        delete NotificationListener.pollingOwner
        delete NotificationListener.cycleCandidates
        NotificationListener.recordCycleDiagnostics(
          Date.now() - startedAt,
          notificationCount
        )
        NotificationListener.schedulePollAfterCycle(
          lifecycleGeneration,
          connectGeneration
        )
      }
    }
  }

  private static schedulePollAfterCycle(
    lifecycleGeneration: number,
    connectGeneration: number
  ) {
    const pendingPollGeneration = NotificationListener.pendingPollGeneration
    delete NotificationListener.pendingPollGeneration

    if (
      pendingPollGeneration &&
      NotificationListener.shouldPoll(
        pendingPollGeneration.lifecycleGeneration,
        pendingPollGeneration.connectGeneration
      )
    ) {
      NotificationListener.scheduleNextPoll(
        pendingPollGeneration.lifecycleGeneration,
        pendingPollGeneration.connectGeneration
      )
      return
    }

    NotificationListener.scheduleNextPoll(
      lifecycleGeneration,
      connectGeneration
    )
  }

  private static async getActiveNotifications(): Promise<
    Array<NotificationDto>
  > {
    // The API answers with eligibleUserIds among the users we have sessions
    // for, judged by their current roles.
    const candidates = await NotificationListener.getRecipientCandidates()
    const result = await NotificationListener.emitWithAck<
      Array<NotificationDto>
    >("notifications/get-all-batch", {
      userIds: [...new Set(candidates.map(({ userId }) => userId))],
    })

    return Array.isArray(result) ? result : []
  }

  private static recordCycleDiagnostics(
    durationMs: number,
    notificationCount: number
  ) {
    NotificationListener.diagnostics.cycles += 1
    NotificationListener.diagnostics.notifications += notificationCount
    NotificationListener.diagnostics.sessionScans +=
      NotificationListener.currentCycleSessionScans
    NotificationListener.diagnostics.totalDurationMs += durationMs

    if (
      NotificationListener.diagnostics.cycles % DIAGNOSTICS_LOG_EVERY === 0 ||
      durationMs >= NotificationListener.pollingDelay
    ) {
      const {
        cycles,
        notifications,
        sessionScans,
        claims,
        sends,
        errors,
        reconnects,
      } = NotificationListener.diagnostics
      const averageDuration = Math.round(
        NotificationListener.diagnostics.totalDurationMs / cycles
      )

      console.info(
        `Notifications: polling diagnostics cycles=${cycles} avgDurationMs=${averageDuration} lastDurationMs=${durationMs} notifications=${notifications} sessionScans=${sessionScans} claims=${claims} sends=${sends} errors=${errors} reconnects=${reconnects}`
      )
    }
  }

  // Sessions with a token, decoded once per polling cycle instead of once per
  // notification. Outside a cycle they are read fresh.
  private static async getRecipientCandidates(): Promise<
    Array<NotificationRecipient>
  > {
    if (
      NotificationListener.isPolling &&
      NotificationListener.cycleCandidates
    ) {
      return NotificationListener.cycleCandidates
    }

    const candidates: Array<NotificationRecipient> = []
    if (NotificationListener.sessions) {
      const allSessionsWithToken = NotificationListener.sessions.find({
        "value.token": { $exists: true, $ne: "" },
      })

      while (await allSessionsWithToken.hasNext()) {
        NotificationListener.currentCycleSessionScans += 1
        const session = (await allSessionsWithToken.next()) as {
          key: string
          value: SessionData
        }

        if (session.value.token) {
          const { userId }: Partial<TokenPayloadDto> = jwtDecode(
            session.value.token
          )

          if (userId) {
            candidates.push({
              userId,
              chatId: session.key.split("/")[1],
            })
          }
        }
      }
    }

    if (NotificationListener.isPolling) {
      NotificationListener.cycleCandidates = candidates
    }
    return candidates
  }

  private static async getNotificationRecipient(
    notification: NotificationDto,
    skippedUserIds: Set<string> = new Set()
  ): Promise<NotificationRecipient | undefined> {
    const candidates = await NotificationListener.getRecipientCandidates()
    // NOTICE: the API decides the audience by current roles; without
    // eligibleUserIds nobody is eligible.
    const eligibleUserIds = notification.eligibleUserIds ?? []

    return candidates.find(
      ({ userId }) =>
        !skippedUserIds.has(userId) &&
        !notification.received.includes(userId) &&
        eligibleUserIds.includes(userId)
    )
  }

  private static async makeEffect(notification: NotificationDto) {
    let menuItemBreadCrumbs: Array<string> | undefined

    let message:
      | { text: string; options: { [key: string]: unknown } }
      | undefined = undefined

    switch (notification.type) {
      case NOTIFICATION_TYPES.MESSAGE:
        message = NotificationListener.buildMessageNotification(notification)
        break

      case NOTIFICATION_TYPES.NEW_THERAPY_REQUEST:
      case NOTIFICATION_TYPES.TRANSFER_THERAPY_REQUEST:
        menuItemBreadCrumbs = getMenuItemBreadCrumbs(
          MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW
        )

        message = {
          text:
            "*Пришел новый терапевтический запрос*" +
            (menuItemBreadCrumbs?.length
              ? ReplyMarkup.newLine +
                ReplyMarkup.escapeForParseModeV2(
                  menuItemBreadCrumbs.join(" > ")
                )
              : ""),
          options: {
            ...ReplyMarkup.parseModeV2,
            reply_markup: new InlineKeyboard().text(
              "Перейти",
              JSON.stringify({
                goTo: MENU_ITEM_TYPES.THERAPY_REQUESTS_NEW,
              })
            ),
          },
        }
        break
    }

    if (!message) {
      return
    }

    // NOTICE: if the API refuses a receipt (e.g. the user lost the role), try
    // the next candidate instead of retrying the same one every cycle.
    const skippedUserIds = new Set<string>()
    let recipient = await NotificationListener.getNotificationRecipient(
      notification,
      skippedUserIds
    )

    while (recipient) {
      try {
        const result = await NotificationListener.sendNotificationOfReceipt(
          notification._id,
          recipient.userId
        )

        if (!result) {
          skippedUserIds.add(recipient.userId)
          recipient = await NotificationListener.getNotificationRecipient(
            notification,
            skippedUserIds
          )
          continue
        }

        NotificationListener.diagnostics.claims += 1
        // NOTICE: important to push userId into notification.received before sending to avoid extra messages
        notification.received.push(recipient.userId)
        await NotificationListener.sendTelegramMessage(
          recipient.chatId,
          message
        )
        NotificationListener.diagnostics.sends += 1
      } catch (error) {
        NotificationListener.diagnostics.errors += 1
        // Log without the Telegram request payload: it contains the chat id
        // and the message text.
        console.error(
          JSON.stringify({
            event: "notification.send.failed",
            notificationId: notification._id,
            errorCode: (error as { error_code?: number })?.error_code,
            description:
              (error as { description?: string })?.description ||
              (error as Error)?.message,
          })
        )
      }
      return
    }
  }

  private static async sendTelegramMessage(
    chatId: string,
    message: { text: string; options: { [key: string]: unknown } }
  ) {
    try {
      return await NotificationListener.bot.api.sendMessage(
        chatId,
        message.text,
        message.options
      )
    } catch (error) {
      if (!("entities" in message.options)) {
        throw error
      }

      console.error(
        "Notification rich-text delivery failed, retrying as plain text",
        (error as { description?: string })?.description ||
          (error as Error)?.message
      )

      return await NotificationListener.bot.api.sendMessage(
        chatId,
        message.text
      )
    }
  }

  private static buildMessageNotification(notification: NotificationDto): {
    text: string
    options: { [key: string]: unknown }
  } {
    const storedEntities = sanitizeNotificationMessageEntities(
      notification.message,
      notification.messageEntities
    )
    const body = storedEntities.length
      ? {
          text: notification.message || "",
          entities: storedEntities,
        }
      : parseNotificationMessageLinks(notification.message)
    const entities: Array<MessageEntity> = []
    let text = body.text

    if (notification.title) {
      const prefix = notification.title + ":\n\n"
      text = prefix + body.text
      entities.push({
        type: "bold",
        offset: 0,
        length: notification.title.length,
      })
      entities.push(
        ...offsetNotificationMessageEntities(body.entities, prefix.length)
      )
    } else {
      entities.push(...body.entities)
    }

    return {
      text,
      options: entities.length ? { entities } : {},
    }
  }

  private static sendNotificationOfReceipt(
    notificationId: string,
    userId: string
  ): Promise<boolean> | undefined {
    return NotificationListener.emitWithAck<boolean>(
      "notifications/add-received",
      {
        notificationId,
        userId,
      }
    )
  }

  private static async onInited() {
    console.log("Notifications: inited")
  }

  private static async onError(error: unknown) {
    console.error(
      `Notifications: connection error (${process.env.API_WEBSOCKET_URL})`,
      getSafeErrorDetails(error)
    )
  }

  private static async onConnect() {
    console.log("Notifications: connected")

    const wasConnected = NotificationListener.isConnected
    NotificationListener.isConnected = true
    if (!wasConnected) {
      NotificationListener.connectGeneration += 1
      NotificationListener.diagnostics.reconnects += 1
    }
    NotificationListener.scheduleNextPoll(
      NotificationListener.lifecycleGeneration,
      NotificationListener.connectGeneration
    )
  }

  private static onUnauthorized(payload?: { message?: unknown }) {
    const message =
      typeof payload?.message === "string" ? payload.message : "no message"
    console.error(
      `Notifications: API rejected the bot client (${message}) — check API_CLIENT_NAME/API_CLIENT_PASSWORD`
    )
  }

  private static async onDisconnect(reason?: string) {
    console.log("Notifications: disconnected")
    if (reason === "io server disconnect") {
      // socket.io does not reconnect after a server-side disconnect. The API
      // only does that for a rejected client, which a restart cannot fix.
      console.error(
        "Notifications: API closed the connection; no reconnect until the bot restarts with valid client credentials"
      )
    }

    NotificationListener.isConnected = false
    NotificationListener.connectGeneration += 1
    NotificationListener.isPolling = false
    delete NotificationListener.pollingOwner
    delete NotificationListener.pendingPollGeneration
    NotificationListener.clearPollingTimeout()
  }

  private static async onException(exception: unknown) {
    console.log("Notifications: exception", getSafeErrorDetails(exception))
  }
}
