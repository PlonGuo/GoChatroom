# Backend Project Structure

## Overview

This backend follows a clean architecture pattern commonly used in Go projects. The structure separates concerns and makes the codebase maintainable and testable.

```
backend/
├── cmd/
│   └── server/
│       └── main.go          # Application entry point
├── internal/
│   ├── config/              # Configuration management
│   │   └── config.go
│   ├── database/            # Database connection and migrations
│   │   └── database.go
│   ├── handler/             # HTTP request handlers (controllers)
│   ├── middleware/          # HTTP middleware (auth, CORS, logging)
│   ├── model/               # Database models (entities)
│   │   ├── user.go
│   │   ├── group.go
│   │   ├── contact.go
│   │   ├── contact_apply.go
│   │   ├── session.go
│   │   └── message.go
│   ├── router/              # Route definitions
│   └── service/             # Business logic layer
│       └── redis/
│           └── redis.go
├── pkg/                     # Shared utilities (public packages)
├── docs/                    # Documentation
├── go.mod                   # Go module definition
├── go.sum                   # Dependency checksums
└── Dockerfile               # Container build (coming later)
```

## Directory Purposes

### `cmd/`

Contains the main applications for this project. Each subdirectory is a separate executable.

- `cmd/server/main.go`: The main HTTP server that starts everything

### `internal/`

Private application code. Go's `internal` directory is special - code here cannot be imported by other projects. This enforces encapsulation.

- **config/**: Reads environment variables and provides configuration to other packages
- **database/**: Manages database connections using GORM
- **handler/**: HTTP handlers that process requests and return responses (like controllers in MVC)
- **middleware/**: Functions that wrap handlers to add functionality (auth checks, logging, CORS)
- **model/**: Database table definitions using Go structs with GORM tags
- **router/**: Groups and registers all routes
- **service/**: Core business logic, separated from HTTP concerns

### `pkg/`

Public library code that could be used by external applications. Currently empty but will contain:

- Utility functions
- Custom error types
- Response helpers

## Data Flow

```
Request → Router → Middleware → Handler → Service → Database/Redis
                                                  ↓
Response ← Router ← Middleware ← Handler ← Service
```

1. **Request arrives** at the Gin router
2. **Middleware executes** (auth check, logging, CORS)
3. **Handler receives** the request, validates input
4. **Service performs** business logic
5. **Database/Redis** operations happen
6. **Response returns** through the same chain

## Key Files Explained

### `main.go`

```go
func main() {
    cfg := config.Get()           // Load configuration
    database.Init()               // Connect to MySQL
    database.Migrate()            // Run migrations
    redis.Init()                  // Connect to Redis

    r := gin.Default()            // Create Gin router
    // Register routes...
    r.Run(":" + cfg.App.Port)     // Start server
}
```

### `config/config.go`

Uses the singleton pattern to load configuration once and share it everywhere:

```go
var cfg *Config
var once sync.Once

func Get() *Config {
    once.Do(func() {
        cfg = load()  // Only runs once
    })
    return cfg
}
```

### `model/*.go`

Define database tables as Go structs:

```go
type User struct {
    ID       int64  `gorm:"primaryKey"`
    UUID     string `gorm:"uniqueIndex"`
    Nickname string `gorm:"type:varchar(50)"`
    // ...
}
```

## Naming Conventions

- **Files**: lowercase with underscores (`contact_apply.go`)
- **Packages**: short, lowercase (`config`, `redis`)
- **Structs**: PascalCase (`UserInfo`, `ContactApply`)
- **Variables**: camelCase (`userService`, `dbConnection`)
- **Constants**: PascalCase (`UserStatusActive`, `MessageTypeText`)
