# How It All Works Together

## Request Lifecycle

When a user makes an API request, here's what happens:

```
Client (React) → HTTP Request → Gin Router → Middleware → Handler → Service → Database/Redis → Response
```

### Example: User Login

```
POST /api/v1/auth/login
{
  "email": "john@example.com",
  "password": "secret123"
}
```

#### Step 1: Router Receives Request

```go
// router/router.go
auth := v1.Group("/auth")
{
    auth.POST("/login", handler.Login)
}
```

#### Step 2: Handler Processes Request

```go
// handler/auth.go
func Login(c *gin.Context) {
    // Parse JSON body
    var req LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": "Invalid request"})
        return
    }

    // Call service
    user, token, err := userService.Login(req.Email, req.Password)
    if err != nil {
        c.JSON(401, gin.H{"error": "Invalid credentials"})
        return
    }

    // Return response
    c.JSON(200, gin.H{
        "token": token,
        "user":  user,
    })
}
```

#### Step 3: Service Performs Business Logic

```go
// service/user/user.go
func (s *UserService) Login(email, password string) (*User, string, error) {
    // Query database
    var user model.User
    if err := database.DB.Where("email = ?", email).First(&user).Error; err != nil {
        return nil, "", errors.New("user not found")
    }

    // Verify password
    if !checkPassword(password, user.Password) {
        return nil, "", errors.New("wrong password")
    }

    // Generate JWT token
    token := generateJWT(user.UUID)

    // Store session in Redis
    redis.Set("session:"+token, user.UUID, 24*time.Hour)

    return &user, token, nil
}
```

#### Step 4: Response Returns to Client

```json
{
  "token": "eyJhbG...",
  "user": {
    "uuid": "abc123",
    "nickname": "John",
    "email": "john@example.com"
  }
}
```

## Data Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│    Gin      │────▶│   Handler   │
│  Frontend   │     │   Router    │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Service   │
                                        │  (Business  │
                                        │   Logic)    │
                                        └──────┬──────┘
                           ┌───────────────────┼───────────────────┐
                           ▼                   ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │    MySQL    │     │    Redis    │     │  WebSocket  │
                    │  (GORM)     │     │             │     │   (Chat)    │
                    └─────────────┘     └─────────────┘     └─────────────┘
```

## Component Responsibilities

### Config
- Load environment variables
- Provide configuration to all components
- Single source of truth for settings

### Database (GORM)
- Persistent storage for users, messages, etc.
- Complex queries and relationships
- Data integrity and transactions

### Redis
- Fast temporary storage
- User sessions and tokens
- Caching frequently accessed data
- Real-time pub/sub for chat

### Handlers
- Parse and validate requests
- Call appropriate services
- Format and return responses
- Don't contain business logic

### Services
- Implement business logic
- Coordinate between database and cache
- Reusable across different handlers

### Middleware
- Authentication (verify JWT)
- CORS (cross-origin requests)
- Logging (request tracking)
- Rate limiting

## Authentication Flow

```
1. User registers → Password hashed → Stored in MySQL
2. User logs in → Password verified → JWT token generated → Stored in Redis
3. User makes request → JWT in header → Middleware validates → Handler processes
4. User logs out → Token deleted from Redis
```

### JWT Token Structure

```
Header.Payload.Signature

Payload:
{
  "user_id": "abc123",
  "exp": 1704067200  // Expiration
}
```

## WebSocket Chat Flow

```
1. Client connects to /ws with token
2. Server validates token, stores connection
3. Client sends message → Server broadcasts to recipients
4. Message stored in MySQL for history
5. Client disconnects → Server removes connection
```

## Database Schema Overview

```
users
├── id (PK)
├── uuid (unique)
├── nickname
├── email (unique)
├── password (hashed)
└── status

contacts
├── id (PK)
├── user_id (FK → users)
├── contact_id (user or group uuid)
├── contact_type (0: user, 1: group)
└── status

groups
├── id (PK)
├── uuid (unique)
├── name
├── owner_id (FK → users)
└── members (JSON)

sessions
├── id (PK)
├── uuid (unique)
├── send_id (owner user)
├── receive_id (contact/group)
└── last_message

messages
├── id (PK)
├── uuid (unique)
├── session_id (FK → sessions)
├── send_id (FK → users)
├── receive_id
├── content
└── type
```

## Error Handling Pattern

```go
// Service returns errors
func (s *Service) DoSomething() (*Result, error) {
    if someCondition {
        return nil, errors.New("something went wrong")
    }
    return &result, nil
}

// Handler converts to HTTP response
func Handler(c *gin.Context) {
    result, err := service.DoSomething()
    if err != nil {
        switch err.Error() {
        case "not found":
            c.JSON(404, gin.H{"error": "Resource not found"})
        case "unauthorized":
            c.JSON(401, gin.H{"error": "Unauthorized"})
        default:
            c.JSON(500, gin.H{"error": "Internal server error"})
        }
        return
    }
    c.JSON(200, result)
}
```

## Environment-Based Configuration

```
Development (local):
├── MySQL: localhost:3306
├── Redis: localhost:6379
└── CORS: http://localhost:5173

Production (cloud):
├── MySQL: PlanetScale URL
├── Redis: Upstash URL
└── CORS: https://gochatroom.vercel.app
```

The same code works in both environments by reading different environment variables.
