import { MyContext } from "@/common/types/myContext"
import { getSafeErrorDetails } from "@/common/utils/getSafeErrorDetails"
import { Conversation } from "@grammyjs/conversations"

// Every dom-api call inside a conversation must go through this wrapper.
// Replay re-runs the conversation from its first update with that update's
// (possibly expired) token; a direct call that fails or returns different data
// changes the replayed path, and the conversations plugin then waits forever.
// A plain `external` would persist the raw AxiosError (JWT header, request
// body) in the session, so only safe error details are stored. On replay the
// error comes back as a plain Error: callers must not branch on its type.
export function safeExternal<T>(
  conversation: Conversation<MyContext>,
  task: () => Promise<T>
): Promise<T> {
  return conversation.external({
    task,
    beforeStoreError: getSafeErrorDetails,
    afterLoadError: (details) =>
      Object.assign(
        new Error((details as { message?: string }).message),
        details
      ),
  })
}
