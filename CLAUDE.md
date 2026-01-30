# GoChatroom Project Guidelines

## Project Overview

GoChatroom is a real-time chat application with:
- **Backend**: Go + Gin + GORM + Redis
- **Frontend**: React 19 + TypeScript + Ant Design + Redux Toolkit
- **Deployment**: Vercel (frontend) + Fly.io (backend)
- **Database**: PlanetScale (MySQL) + Upstash (Redis)

## Project Structure

```
GoChatroom/
├── backend/
│   ├── cmd/server/main.go       # Entry point
│   ├── internal/
│   │   ├── config/              # Environment config
│   │   ├── database/            # GORM connection
│   │   ├── handler/             # HTTP handlers
│   │   ├── middleware/          # Auth, CORS, logging
│   │   ├── model/               # Database models
│   │   ├── router/              # Route definitions
│   │   └── service/             # Business logic
│   │       └── redis/           # Redis client
│   ├── pkg/                     # Shared utilities
│   └── docs/                    # Backend documentation
│
├── frontend/
│   ├── src/
│   │   ├── api/                 # API service functions
│   │   ├── components/          # Reusable UI components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── pages/               # Page components
│   │   ├── store/               # Redux slices
│   │   ├── types/               # TypeScript interfaces
│   │   ├── utils/               # Utility functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── ...config files
│
├── docker-compose.yml           # Local development
├── .env.example                 # Environment template
└── README.md
```

## Frontend Design Principles

### File Organization - One Component Per File

**IMPORTANT**: For each UI component and function, create a separate file. Do NOT put multiple functions or components in one file which makes the file verbose and long.

#### ✅ Good - Separate Files

```
components/
├── Button/
│   ├── Button.tsx           # Button component
│   ├── Button.styles.ts     # Styled components (if needed)
│   └── index.ts             # Export
├── Input/
│   ├── Input.tsx
│   └── index.ts
├── Avatar/
│   ├── Avatar.tsx
│   └── index.ts
└── MessageBubble/
    ├── MessageBubble.tsx
    └── index.ts

hooks/
├── useAuth.ts               # One hook per file
├── useWebSocket.ts
├── useDebounce.ts
└── useLocalStorage.ts

utils/
├── formatDate.ts            # One utility per file
├── formatTime.ts
├── validateEmail.ts
└── generateUUID.ts
```

#### ❌ Bad - Multiple Functions in One File

```
// DON'T do this - utils/helpers.ts with everything
export const formatDate = () => {...}
export const formatTime = () => {...}
export const validateEmail = () => {...}
export const generateUUID = () => {...}
// ... 500 more lines
```

### Component Guidelines

1. **Each component should have its own folder** with:
   - `ComponentName.tsx` - Main component
   - `index.ts` - Re-export
   - Optional: `ComponentName.test.tsx`, `ComponentName.styles.ts`

2. **Keep components small and focused**
   - Each component does ONE thing well
   - Extract sub-components when logic grows

3. **Name files the same as the component**
   ```
   // Avatar.tsx
   export const Avatar = () => {...}

   // index.ts
   export { Avatar } from './Avatar';
   ```

### Hook Guidelines

1. **One hook per file**
   ```
   hooks/
   ├── useAuth.ts
   ├── useWebSocket.ts
   └── useMessages.ts
   ```

2. **Name hooks with `use` prefix**
   ```typescript
   // useAuth.ts
   export const useAuth = () => {
     // auth logic
   }
   ```

### API Service Guidelines

1. **Group by feature, one function per file when complex**
   ```
   api/
   ├── auth/
   │   ├── login.ts
   │   ├── register.ts
   │   └── index.ts
   ├── user/
   │   ├── getUser.ts
   │   ├── updateUser.ts
   │   └── index.ts
   └── message/
       ├── sendMessage.ts
       ├── getMessages.ts
       └── index.ts
   ```

2. **For simple CRUD, a single file per entity is acceptable**
   ```
   api/
   ├── userApi.ts          # If simple CRUD
   ├── messageApi.ts
   └── groupApi.ts
   ```

### Redux Store Guidelines

1. **One slice per feature**
   ```
   store/
   ├── authSlice.ts
   ├── chatSlice.ts
   ├── contactSlice.ts
   └── index.ts
   ```

### TypeScript Types

1. **Group related types in feature folders**
   ```
   types/
   ├── user.ts              # User-related types
   ├── message.ts           # Message-related types
   ├── group.ts             # Group-related types
   └── api.ts               # API response types
   ```

## Backend Code Style

### Handler Pattern
```go
func CreateUser(c *gin.Context) {
    // 1. Parse & validate request
    // 2. Call service
    // 3. Return response
}
```

### Service Pattern
```go
func (s *UserService) Create(name, email, password string) (*User, error) {
    // Business logic here
}
```

### Error Handling
```go
if err != nil {
    return fmt.Errorf("failed to create user: %w", err)
}
```

## Environment Variables

### Backend
```
APP_ENV=development
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_USER=gochatroom
DB_PASSWORD=gochatroom
DB_NAME=gochatroom
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:5173
```

### Frontend
```
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

## Development Commands

### Backend
```bash
cd backend
go run cmd/server/main.go
```

### Frontend
```bash
cd frontend
npm run dev
```

### Database
```bash
docker-compose up -d    # Start MySQL + Redis
docker-compose down     # Stop
```

## Commit Message Format

```
feat(scope): short description

- Detail 1
- Detail 2

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Scopes: `backend`, `frontend`, `infra`, `ci`, `docs`
