import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { makeContext, makeFakeConversation } from "../helpers/fakeConversation"

describe("fake conversation helper", () => {
  it("returns a numeric timestamp from now", async () => {
    const now = new Date("2026-07-10T12:34:56.000Z")
    const conversation = makeFakeConversation({ now })

    assert.equal(await conversation.now(), now.getTime())
  })

  it("creates fresh session data with isolated nested quiz answers", () => {
    const firstContext = makeContext()
    const secondContext = makeContext()
    firstContext.session.quizAnswers["quiz-1"] = { answer: "yes" } as never

    assert.deepEqual(secondContext.session.quizAnswers, {})

    const firstConversation = makeFakeConversation()
    const secondConversation = makeFakeConversation()
    firstConversation.session.quizAnswers["quiz-2"] = { answer: "no" } as never

    assert.deepEqual(secondConversation.session.quizAnswers, {})
  })

  it("accepts queued text contexts for message:text and :text filters", async () => {
    const messageTextConversation = makeFakeConversation({ answers: ["Hello"] })
    const textShortcutConversation = makeFakeConversation({ answers: ["Hi"] })

    const messageTextCtx =
      await messageTextConversation.waitFor("message:text")
    const textShortcutCtx = await textShortcutConversation.waitFor(":text")

    assert.equal(messageTextCtx.message?.text, "Hello")
    assert.equal(textShortcutCtx.message?.text, "Hi")
  })

  it("rejects queued text contexts for callback data filters", async () => {
    const conversation = makeFakeConversation({ answers: ["not a callback"] })

    await assert.rejects(
      () => conversation.waitFor("callback_query:data"),
      /does not match waitFor\("callback_query:data"\)/
    )
  })
})
