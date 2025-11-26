# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Telegram bot for DOM psychologist team (dom-bot) built with TypeScript, grammY framework, and MongoDB. The bot handles therapy requests, client management, and psychologist workflows with a conversation-based interface.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to dist/ folder with path transformation and asset copying
- `npm run start` - Run production build
- `npm run lint` - Lint code with ESLint (fix-dry-run mode)

### Memory Management
If you encounter heap size issues:
```bash
export NODE_OPTIONS="--max-old-space-size=8192"
```

For VSCode TypeScript performance (recommended):
```bash
export NODE_OPTIONS="--max-old-space-size=8192 --max-semi-space-size=1024"
```

Check available heap:
```bash
node -e 'console.log(v8.getHeapStatistics().heap_size_limit/(1024*1024))'
```

### VSCode Performance Optimization
The project includes optimized TypeScript and VSCode settings for better IntelliSense performance:
- Incremental compilation enabled with `.tsbuildinfo` caching
- TypeScript service memory limit set to 8GB
- Selective file watching and exclusions
- Disabled automatic package imports for faster suggestions

### Important: Webhook vs Long Polling
The bot uses long polling (`getUpdates`) via `@grammyjs/runner`. If you see webhook conflict errors, the fix is already implemented in `src/index.ts` - make sure `await domBot.api.deleteWebhook()` is called before starting the runner.

## Architecture

### Core Structure
- **Entry Point**: `src/index.ts` - Initializes runner with webhook cleanup
- **Bot Configuration**: `src/domBot.ts` - Main bot setup, middleware, and handlers
- **Conversations**: `src/conversations/` - All bot conversation flows
- **Components**: `src/components/` - Reusable UI components (MenuBlock, Form, Quiz)
- **API Layer**: `src/api/` - HTTP client for backend communication
- **Services**: `src/services/` - Database connections and external services

### Key Architectural Patterns

#### Conversation-Based Architecture
Uses `@grammyjs/conversations` for multi-step user interactions. All conversations are registered in `src/conversations/index.ts` with the `BotConversations` manager:

- Conversations are stateful and can be entered/exited/reentered
- Each conversation has a name from `CONVERSATION_NAMES` enum
- Context preloading supported for data-heavy conversations
- Middleware system for conversation management

#### Component System

**MenuBlock**: Dynamic menu system with hierarchical navigation
- Role-based filtering using `ROLES` enum
- Pagination and search capabilities
- Submenu loading from API (users, clients, therapy requests, etc.)
- Deep linking and breadcrumb navigation
- Supports both static items and dynamic submenus via `SUBMENU_TYPES`

**Form**: Type-safe form builder for data collection
- Generic type support `Form<T extends ObjectWithPrimitiveValues>`
- Multiple input types: string, number, float, boolean, select, date
- Built-in validation and error handling
- Keyboard generation with navigation buttons
- Calendar integration for date inputs

**Quiz**: Interactive questionnaire system
- Multiple question types and languages
- Answer collection and result calculation
- Schema-based validation

#### Session Management
- MongoDB-based session storage via `@grammyjs/storage-mongodb`
- Per-user-per-chat session isolation
- Custom session key generation: `${ctx.from.id}/${ctx.chat.id}`

#### Type System
Custom type definitions in `src/common/types/`:
- `MyContext` - Extended grammY context with user data and conversation state
- `SessionData` - Session storage structure
- `ObjectWithPrimitiveValues` - Type constraints for form data
- `BotConversation` - Conversation interface

### Path Aliases
TypeScript path mapping configured for clean imports:
- `@/api/*` → `src/api/*`
- `@/common/*` → `src/common/*`  
- `@/components/*` → `src/components/*`
- `@/conversations/*` → `src/conversations/*`
- `@/services/*` → `src/services/*`
- `@/*` → `src/*`

### Environment Configuration
Environment variables in `config/.env`:
- `TOKEN` - Telegram bot token
- `MONGO_DB_*` - MongoDB connection settings
- `API_*` - Backend API configuration
- `API_WEBSOCKET_URL` - WebSocket for real-time notifications

### External Integrations
- **Backend API**: HTTP client in `src/api/` with auth middleware
- **WebSocket**: `NotificationListener` for real-time updates
- **MongoDB**: Session storage and conversation state
- **Telegram**: Bot API through grammY framework

## Code Patterns

### Error Handling
- Centralized error messages in `BOT_ERRORS` enum
- Try-catch blocks around conversation operations
- Graceful fallbacks for failed API calls
- Error boundary for conversation crashes

### State Management
- Session-based user state in MongoDB
- Conversation-scoped temporary state
- Deep linking for direct navigation to specific menu items
- Context preloading for performance optimization

### API Integration
- Middleware for automatic Telegram auth (`apiLoginByTelegram`)
- Typed DTOs for API communication
- Standardized HTTP methods in `src/api/common/`
- Error handling and retry logic

### UI Patterns
- Inline keyboards for menu navigation
- Reply keyboards for form inputs
- Pagination for large datasets
- Breadcrumb navigation in menus
- Search functionality with filtering

When working with this codebase, remember that most user interactions happen through conversations, menu navigation is role-based, and the bot maintains session state across interactions.