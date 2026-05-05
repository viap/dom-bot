# AGENTS.md — dom-bot coding rules

This file provides guidance for AI coding agents (Codex, etc.) working in the `dom-bot` grammY Telegram bot.

For cross-service architecture, auth contracts, and stack rules, read the files in `../ai-context/`.

## Mandatory Rules

- **Never use webhooks.** The bot runs on long polling via `@grammyjs/runner`. Webhooks cause conflicts with the runner. `deleteWebhook()` is called in `src/index.ts` before startup — do not remove it.
- **Always type context as `MyContext`**, never plain grammY `Context`. `MyContext` is required to access `ctx.session`, `ctx.conversation`, and other extensions.
- **Never bypass `apiLoginByTelegram` middleware.** It handles JWT token acquisition and refresh on every message. Removing it breaks all API calls.
- **Always wrap API calls and DB queries inside `conversation.external()`** when inside a conversation. Calling them directly corrupts conversation state replay.
- **Never mutate session properties with direct assignment.** Use `Object.assign(ctx.session, { key: value })` or spread to ensure persistence.
- **Always use `@/*` path aliases** (`@/api/*`, `@/common/*`, `@/components/*`, `@/conversations/*`, `@/services/*`). Never write deep relative imports.
- **Never hardcode secrets.** All config comes from `config/.env` via `process.env`.
- **Always register new conversations in `BotConversations.getList()`** in `src/conversations/index.ts`. An unregistered conversation is unreachable.

## Do Not Do

### 1. Never use webhooks
```typescript
// ❌
bot.start({ onStart: ..., webhook: ... });

// ✓ — src/index.ts already does this correctly
await domBot.api.deleteWebhook();
run(domBot);
```

### 2. Never use plain `ctx.reply()` for multi-step flows
```typescript
// ❌ — brittle, no navigation, no role filtering
await ctx.reply('Choose an option:', { reply_markup: keyboard });
const response = await conversation.waitFor('message:text');

// ✓ — use MenuBlock for navigation, Form for data collection
const menu = new MenuBlock(conversation, ctx, menuStructure, options);
await menu.show();
```

### 3. Never access `ctx.session.token` without a guard
```typescript
// ❌ — token may be undefined if auth failed
const data = await getRequest(`/users`, ctx.session.token);

// ✓
if (!ctx.session.token) {
  await ctx.reply('Session expired. Please use /start.');
  return;
}
const data = await getRequest(`/users`, ctx.session.token);
```

### 4. Never call API functions directly inside a conversation
```typescript
// ❌ — corrupts conversation state machine on replay
const users = await getAllUsers(ctx);

// ✓ — wrap in conversation.external()
const users = await conversation.external(async () => getAllUsers(ctx));
```

### 5. Never mutate session properties with direct assignment
```typescript
// ❌ — may not persist to MongoDB storage
ctx.session.user = newUser;

// ✓
Object.assign(ctx.session, { user: newUser });
```

### 6. Never add a conversation without registering it
```typescript
// ❌ — entering by name will silently do nothing
ctx.conversation.enter(CONVERSATION_NAMES.MY_NEW_CONV);

// ✓ — add myNewConversation to BotConversations.getList() in src/conversations/index.ts
```

### 7. Never use `conversation.waitFor()` without keyboard guidance
```typescript
// ❌ — user has no idea what to type; bot hangs
await conversation.waitFor('message:text');

// ✓ — always show a keyboard or explicit instructions first
await ctx.reply('Enter a name:', { reply_markup: cancelKeyboard });
const { message } = await conversation.waitFor('message:text');
```

### 8. Never import the bare grammY `Context` type in conversation files
```typescript
// ❌
import { Context } from 'grammy';
async function myHandler(ctx: Context) { … }

// ✓
import { MyContext } from '@/common/types/myContext';
async function myHandler(ctx: MyContext) { … }
```

---

## Bot Architecture

```
src/index.ts          — runner bootstrap, webhook cleanup, graceful shutdown
src/domBot.ts         — Bot<MyContext> instance, middleware stack, command/conversation routing
src/conversations/    — all conversation logic
src/components/       — reusable UI components (MenuBlock, Form, Quiz)
src/api/              — HTTP client for dom-api communication
src/services/         — MongoDB session DB, NotificationListener (WebSocket)
src/common/           — types, enums, utilities
```

**Middleware order in `domBot.ts` (must not be reordered):**
1. `session()` — MongoDB-backed session storage, key: `${userId}/${chatId}`
2. `apiLoginByTelegram` — JWT token lifecycle on every message
3. `conversations()` — enables conversation system

All commands and callback routes attach via `BotConversations.getMiddlewareByName()`.

---

## Conversation Pattern

**Structure — implement `BotConversation` interface:**
```typescript
import { BotConversation } from '@/common/types/botConversation';
import { CONVERSATION_NAMES } from '@/conversations/enums/conversationNames';
import { MyContext } from '@/common/types/myContext';
import { Conversation } from '@grammyjs/conversations';

const myConversation: BotConversation = {
  getName() {
    return CONVERSATION_NAMES.MY_CONVERSATION;
  },

  // optional: preload data before conversation starts
  // contextPreload: async (ctx: MyContext) => { return [await loadSomething(ctx)]; },

  getConversation(...props) {
    return async (conversation: Conversation<MyContext>, ctx: MyContext) => {
      try {
        // Always wrap API/DB calls:
        const data = await conversation.external(async () => fetchData(ctx));

        // Use components for UI:
        const form = new Form(conversation, ctx, inputs);
        const result = await form.requestData();
        if (result.status !== FORM_RESULT_STATUSES.SAVED) return;

      } catch (error) {
        conversation.log(BOT_ERRORS.CONVERSATION, error);
        await ctx.reply(BOT_ERRORS.UNKNOWN);
      }
    };
  },
};

export default myConversation;
```

**Register in `src/conversations/index.ts`:**
```typescript
getList(): Array<BotConversation> {
  return [
    // ... existing conversations
    myConversation,  // add here
  ];
}
```

**Enter a conversation from a command or callback:**
```typescript
domBot
  .filter(getFilterByCommand(BOT_COMMANDS.MY_COMMAND))
  .use(BotConversations.getMiddlewareByName(CONVERSATION_NAMES.MY_CONVERSATION));
```

Use `contextPreload` when the conversation needs data available from its very first line (e.g., loading a user list before showing the menu).

---

## Component Usage

### MenuBlock
Role-filtered navigation menus with pagination, search, and API-driven submenus.

```typescript
const menu = new MenuBlock(conversation, ctx, menuItems, {
  title: 'Choose an option',
  backButton: true,
});
const result = await menu.show(); // loops until user selects or exits
```

- Always load dynamic submenu items via `conversation.external()` — MenuBlock does this internally for `SUBMENU_TYPES`.
- Never replicate menu logic with raw `waitFor()` + inline keyboards.

### Form
Type-safe multi-field data collection.

```typescript
const inputs = [
  { key: 'name', label: 'Full name', type: FORM_INPUT_TYPES.STRING },
  { key: 'age', label: 'Age', type: FORM_INPUT_TYPES.NUMBER },
] as const;

const form = new Form(conversation, ctx, inputs);
const result = await form.requestData();

if (result.status === FORM_RESULT_STATUSES.SAVED) {
  const { name, age } = result.data;  // typed
}
```

Never write custom input-collection loops — always use `Form`.

### Quiz
Schema-based questionnaire. Follow existing `Quiz` usage in the codebase as a template.

---

## API Layer

All requests go through typed helpers in `src/api/common/`:

```typescript
import { getRequest, postRequest, putRequest, deleteRequest } from '@/api/common/apiMethods';

// Always inside conversation.external():
const users = await conversation.external(async () =>
  getRequest<UserDto[]>('/users', ctx.session.token)
);
```

- Token is `ctx.session.token` (set by `apiLoginByTelegram` middleware).
- All helpers return `Promise<T>` — no error catching inside; wrap calls in `try/catch` in the conversation.

---

## Session & State

```typescript
type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;

type SessionData = {
  token?: string;              // JWT from dom-api
  hasTermsAgreement: boolean;
  user?: UserDto;              // logged-in user profile
  psychologist?: PsychologistDto; // set when user is a psychologist
  selectedQuiz?: ObjectId;
  quizAnswers: QuizGivenAnswers;
};
```

Session key: `${ctx.from.id}/${ctx.chat.id}` — per-user, per-chat. Storage: MongoDB via `@grammyjs/storage-mongodb`.

Always update session via `Object.assign(ctx.session, { ... })`.

---

## Error Handling

- Use `BOT_ERRORS` enum (`@/common/enums/botErrors`) for logging.
- Use `CONVERSATION_ERRORS` enum for user-facing strings.
- Wrap conversation bodies in `try/catch`. Log with `conversation.log()`. Show a safe message to the user with `ctx.reply()`.
- Never swallow errors silently with empty catch blocks.

```typescript
try {
  // ...
} catch (error) {
  conversation.log(BOT_ERRORS.CONVERSATION, error);
  await ctx.reply(BOT_ERRORS.UNKNOWN);
}
```

---

## Environment Variables

All loaded from `config/.env` via `process.env`.

| Variable | Purpose |
|---|---|
| `TOKEN` | Telegram bot token |
| `MONGO_DB_URL` | MongoDB connection string |
| `MONGO_DB_NAME` | Database name (`domBot`) |
| `MONGO_DB_USER` | MongoDB username |
| `MONGO_DB_PASSWORD` | MongoDB password |
| `API_URL` | dom-api base URL (e.g., `http://localhost:3003`) |
| `API_CLIENT_NAME` | Bot's API client name for dom-api auth |
| `API_CLIENT_PASSWORD` | Bot's API client password |
| `API_WEBSOCKET_URL` | dom-api WebSocket URL for `NotificationListener` |
| `POLLING_DELAY` | Polling delay in ms for notification listener |

---

## File Naming Conventions

| File type | Pattern | Example |
|---|---|---|
| Conversation | `[action][Subject].ts` | `showRequisites.ts` |
| Component | PascalCase dir + `[Name].ts` | `MenuBlock/menuBlock.ts` |
| API module | `[entity].api.ts` | `users.api.ts` |
| API methods | `apiMethods.ts` in `api/common/` | — |
| Enum | `[subject].enum.ts` | `botErrors.ts` |
| Type | `[subject].ts` in `common/types/` | `myContext.ts`, `sessionData.ts` |
| Service | `[subject].service.ts` | `notification.service.ts` |

---

## Keeping Documentation Up to Date

After completing any task, check whether your changes affect how future agents should work in this codebase. If they do, update **both** `CLAUDE.md` and `AGENTS.md` before finishing.

**Do update the docs when you:**
- Introduce a new pattern, convention, or utility that other code should follow.
- Add a new component type, conversation pattern, or API helper with a structure others should replicate.
- Change middleware order, session structure, or naming conventions.
- Deviate from an existing guideline (update the guideline to reflect the new norm).

**Do not update the docs for:**
- One-off conversation logic that is not a template for other code.
- Bug fixes that do not change conventions.
- Changes already covered by existing rules.

**How to add entries:** Place them in the most relevant existing section. Keep each entry to one or two bullet points. Do not create new top-level sections for a single rule.
