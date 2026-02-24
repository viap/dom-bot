# DOM Bot - Telegram Bot for Psychologist Team Management

> Telegram bot для команды психологов DOM в Тбилиси
> [Instagram: @psydom_tbilisi](https://www.instagram.com/psydom_tbilisi/)

## 🧠 Overview

DOM Bot is a sophisticated Telegram bot built for managing psychologist team workflows, client relationships, and therapy sessions. It provides a conversation-based interface for handling therapy requests, client management, session tracking, and team coordination.

## ✨ Key Features

### 🔄 Therapy Request Management
- **Create & Submit**: Clients can submit therapy requests through interactive forms
- **Accept/Reject**: Psychologists can review and respond to requests
- **Transfer**: Reassign requests between team members
- **Status Tracking**: Real-time updates on request progress

### 👥 Client Management
- **Client Database**: Add, edit, and manage client profiles
- **Contact Information**: Store and update client contact details
- **History Tracking**: Maintain comprehensive client interaction history
- **Role-based Access**: Secure client data based on psychologist permissions

### 📊 Session & Analytics
- **Session Logging**: Track therapy sessions with detailed metadata
- **Personal Statistics**: Individual psychologist performance metrics
- **General Statistics**: Team-wide analytics and reporting
- **Time Tracking**: Session duration and scheduling management

### 🧩 Interactive Components
- **Quiz System**: Multi-language psychological assessments
- **Form Builder**: Type-safe data collection with validation
- **Menu Navigation**: Role-based hierarchical menu system
- **Real-time Notifications**: WebSocket-powered instant updates

## 🛠 Technical Stack

- **Runtime**: Node.js with TypeScript (ESNext)
- **Bot Framework**: [grammY](https://grammy.dev/) - Modern Telegram bot framework
- **Database**: MongoDB with Mongoose ODM
- **Session Storage**: MongoDB-based session management
- **Real-time Communication**: Socket.io for WebSocket connections
- **Architecture**: Conversation-driven with modular components

### Core Dependencies
```json
{
  "grammy": "^1.19.2",
  "@grammyjs/conversations": "^1.1.1",
  "@grammyjs/runner": "^1.0.4",
  "@grammyjs/storage-mongodb": "^2.1.1",
  "mongoose": "^7.0.1",
  "socket.io-client": "^4.7.2"
}
```

## 🏗 Project Architecture

### Directory Structure
```
src/
├── api/                    # HTTP client & API communication
│   ├── common/            # Shared HTTP utilities
│   ├── dto/               # Data Transfer Objects
│   └── controller*/       # API endpoint controllers
├── common/                # Shared utilities & types
│   ├── dto/              # Common data structures
│   ├── enums/            # Constants & enumerations
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper functions
├── components/           # Reusable UI components
│   ├── Form/            # Type-safe form builder
│   ├── MenuBlock/       # Hierarchical menu system
│   ├── Quiz/            # Interactive questionnaire
│   └── NotificationListener/ # Real-time notifications
├── conversations/        # Bot conversation flows
│   ├── users/           # User management flows
│   ├── clients/         # Client management flows
│   ├── therapyRequests/ # Request handling flows
│   └── therapySessions/ # Session management flows
└── services/            # External service integrations
    └── db/              # Database connection
```

### Component System

#### 🗂 MenuBlock
- **Hierarchical Navigation**: Multi-level menu system
- **Role-based Filtering**: Access control based on user roles
- **Dynamic Submenus**: API-driven menu population
- **Search & Pagination**: Large dataset navigation
- **Deep Linking**: Direct navigation to specific items

#### 📝 Form
- **Type Safety**: Generic form builder `Form<T>`
- **Multiple Input Types**: string, number, boolean, date, select
- **Built-in Validation**: Real-time input validation
- **Calendar Integration**: Date picker for scheduling
- **Error Handling**: User-friendly error messages

#### ❓ Quiz
- **Question Types**: Various assessment formats
- **Result Calculation**: Automated scoring algorithms
- **Progress Tracking**: Session-based quiz state

### Conversation Architecture

The bot uses **stateful conversations** for complex user interactions:

```typescript
// Conversation registration
domBot.use(BotConversations.getMiddlewareByName(CONVERSATION_NAMES.SELECT_MENU_ITEM))

// Context preloading for performance
conversation.contextPreload = async (ctx) => {
  return await loadUserData(ctx.from.id)
}
```

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** 18+
- **MongoDB** 5.0+
- **Telegram Bot Token** ([create via @BotFather](https://t.me/BotFather))

### Installation
```bash
# Clone repository
git clone <repository-url>
cd dom-bot

# Install dependencies
npm install

# Configure environment
cp config/.env.example config/.env
# Edit config/.env with your settings
```

### Environment Configuration
Create `config/.env` with:
```env
# Telegram Bot
TOKEN=your_telegram_bot_token

# MongoDB
MONGO_DB_HOST=localhost
MONGO_DB_PORT=27017
MONGO_DB_NAME=dom_bot
MONGO_DB_USERNAME=
MONGO_DB_PASSWORD=

# Backend API
API_URL=your_api_base_url
API_WEBSOCKET_URL=your_websocket_url
```

## 💻 Development

### Available Scripts
```bash
# Development with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code (dry-run mode)
npm run lint

# Debug mode
npm run startInspect
```

### Memory Configuration
For large codebases, configure Node.js heap size:
```bash
# Set environment variable
export NODE_OPTIONS="--max-old-space-size=8192"

# Check current heap limit
node -e 'console.log(v8.getHeapStatistics().heap_size_limit/(1024*1024))'
```

### Development Workflow
1. **Hot Reload**: `npm run dev` starts nodemon with TypeScript compilation
2. **Path Aliases**: Import modules using `@/` shortcuts
3. **Type Safety**: Full TypeScript strict mode enabled
4. **Incremental Builds**: `.tsbuildinfo` caching for faster compilation

### VSCode Optimization
The project includes optimized settings for TypeScript IntelliSense:
- Memory limit: 8GB for TypeScript service
- Incremental compilation with caching
- Selective file watching for performance

## 🔧 Configuration

### TypeScript Path Aliases
```typescript
// tsconfig.json paths
"@/api/*": ["api/*"],
"@/common/*": ["common/*"],
"@/components/*": ["components/*"],
"@/conversations/*": ["conversations/*"],
"@/services/*": ["services/*"]
```

### Session Management
```typescript
// MongoDB-based session storage
function getSessionKey(ctx: Context): string {
  return `${ctx.from.id}/${ctx.chat.id}`
}

// Session data structure
interface SessionData {
  user?: UserDTO
  // ... other session fields
}
```

### Webhook vs Long Polling
The bot uses **long polling** by default:
```typescript
// Webhook cleanup before starting
await domBot.api.deleteWebhook()

// Start with grammY runner
const runner = run(domBot)
```

## 🎯 Usage Examples

### Creating a Conversation
```typescript
export default {
  getName: () => CONVERSATION_NAMES.CLIENT_ADD,
  getConversation: () => async (conversation: MyConversation, ctx: MyContext) => {
    const form = new Form<ClientDTO>({
      fields: {
        name: { type: FORM_INPUT_TYPES.STRING, required: true },
        phone: { type: FORM_INPUT_TYPES.STRING, required: true },
        email: { type: FORM_INPUT_TYPES.STRING, required: false }
      }
    })

    const result = await form.run(conversation, ctx, "Add New Client")
    // Handle form result...
  }
}
```

### Menu Navigation
```typescript
const menuBlock = new MenuBlock({
  title: "Main Menu",
  items: [
    { text: "Therapy Requests", type: MENU_ITEM_TYPES.THERAPY_REQUESTS },
    { text: "Client Management", type: MENU_ITEM_TYPES.CLIENTS },
    { text: "Statistics", type: MENU_ITEM_TYPES.STATISTICS }
  ]
})

await menuBlock.run(conversation, ctx)
```

## 🤝 Contributing

### Code Style
- **ESLint**: Configured with TypeScript and Prettier
- **Prettier**: Automatic code formatting
- **Strict TypeScript**: Full type safety enforcement
- **Path Aliases**: Use `@/` imports for clean module resolution

### File Organization
- **Conversations**: One file per conversation flow
- **Components**: Reusable UI building blocks
- **DTOs**: Shared data structures
- **Enums**: Centralized constants

### Error Handling
```typescript
// Conversation error boundaries
domBot.errorBoundary((err) => {
  console.error(BOT_ERRORS.CONVERSATION, err)
})

// API error handling
try {
  const result = await apiCall()
} catch (error) {
  await ctx.reply(BOT_ERRORS.API_UNAVAILABLE)
}
```