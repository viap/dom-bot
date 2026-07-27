import assert from "node:assert/strict"
import { afterEach, beforeEach, describe, it } from "node:test"
import { isValidToken } from "@/api/controllerAuth/isValidToken"
import { loginByTelegram } from "@/api/controllerAuth/loginByTelegram"
import { getUser } from "@/api/controllerUsers/getUser"
import { createNotification } from "@/api/controllerNotifications/createNotification"
import { getAllTherapyRequests } from "@/api/controllerTherapyRequests/getAllTherapyRequests"
import { NOTIFICATION_TYPES } from "@/common/enums/notificationTypes"
import { ROLES } from "@/common/enums/roles"
import { makeContext } from "../helpers/fakeConversation"
import { makeTherapyRequest, makeUser } from "../helpers/fixtures"
import { withMockedApiClient } from "../helpers/apiClientMock"

describe("dom-api client boundary", () => {
  let originalApiUrl: string | undefined
  let originalClientName: string | undefined
  let originalClientPassword: string | undefined

  beforeEach(() => {
    originalApiUrl = process.env.API_URL
    originalClientName = process.env.API_CLIENT_NAME
    originalClientPassword = process.env.API_CLIENT_PASSWORD
    process.env.API_URL = "http://dom-api.test"
    process.env.API_CLIENT_NAME = "bot-client"
    process.env.API_CLIENT_PASSWORD = "bot-password"
  })

  afterEach(() => {
    process.env.API_URL = originalApiUrl
    process.env.API_CLIENT_NAME = originalClientName
    process.env.API_CLIENT_PASSWORD = originalClientPassword
  })

  it("constructs Telegram login payload without real network calls", async () => {
    const mock = withMockedApiClient(() => ({
      status: 200,
      data: { auth_token: "new-token" },
    }))

    try {
      const result = await loginByTelegram(makeContext(), {
        id: "101",
        is_bot: false,
        first_name: "Test",
        last_name: "User",
        username: "test_user",
      })

      assert.equal(result.auth_token, "new-token")
      assert.equal(mock.calls[0].method, "post")
      assert.equal(mock.calls[0].url, "http://dom-api.test/auth/login/telegram")
      assert.deepEqual(mock.calls[0].data, {
        apiClient: { name: "bot-client", password: "bot-password" },
        telegram: {
          id: "101",
          username: "test_user",
          first_name: "Test",
          last_name: "User",
        },
      })
    } finally {
      mock.restore()
    }
  })

  it("sends bearer headers and maps user responses", async () => {
    const user = makeUser({ roles: [ROLES.EDITOR] })
    const mock = withMockedApiClient(() => ({ status: 200, data: user }))

    try {
      const ctx = makeContext({ session: { token: "auth-token" } })
      const result = await getUser(ctx)

      assert.deepEqual(result, user)
      assert.equal(mock.calls[0].url, "http://dom-api.test/users/me")
      assert.equal(
        (mock.calls[0].headers as { Authorization?: string }).Authorization,
        "Bearer auth-token"
      )
    } finally {
      mock.restore()
    }
  })

  it("passes query params for therapy request list calls", async () => {
    const mock = withMockedApiClient(() => ({
      status: 200,
      data: [makeTherapyRequest()],
    }))

    try {
      await getAllTherapyRequests(makeContext(), { accepted: false })

      assert.equal(mock.calls[0].url, "http://dom-api.test/therapy-requests")
      assert.deepEqual(mock.calls[0].params, { accepted: false })
    } finally {
      mock.restore()
    }
  })

  it("constructs notification create payloads", async () => {
    const mock = withMockedApiClient(() => ({
      status: 200,
      data: { _id: "notification-1" },
    }))

    try {
      await createNotification(makeContext(), {
        title: "Title",
        message: "Body",
        messageEntities: [],
        roles: [ROLES.EDITOR],
        type: NOTIFICATION_TYPES.MESSAGE,
      })

      assert.equal(mock.calls[0].method, "post")
      assert.equal(mock.calls[0].url, "http://dom-api.test/notifications")
      assert.equal((mock.calls[0].data as { title: string }).title, "Title")
    } finally {
      mock.restore()
    }
  })

  it("maps token validation transport failures to false", async () => {
    const mock = withMockedApiClient(() => {
      throw new Error("network down")
    })

    try {
      const valid = await isValidToken(
        makeContext({ session: { token: "stale-token" } })
      )

      assert.equal(valid, false)
    } finally {
      mock.restore()
    }
  })
})
