# Gin Web Framework

## What is Gin?

Gin is a high-performance HTTP web framework for Go. It's similar to Express.js (Node.js) or Flask (Python). Gin provides:

- Fast HTTP routing
- Middleware support
- JSON validation
- Error handling
- Request/response helpers

## Basic Setup

```go
package main

import "github.com/gin-gonic/gin"

func main() {
    // Create router with default middleware (logger, recovery)
    r := gin.Default()

    // Define routes
    r.GET("/hello", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "Hello World"})
    })

    // Start server
    r.Run(":8080")
}
```

## Routing

### HTTP Methods

```go
r.GET("/users", getUsers)
r.POST("/users", createUser)
r.PUT("/users/:id", updateUser)
r.DELETE("/users/:id", deleteUser)
r.PATCH("/users/:id", patchUser)
```

### Route Parameters

```go
// URL: /users/123
r.GET("/users/:id", func(c *gin.Context) {
    id := c.Param("id")  // "123"
    c.JSON(200, gin.H{"id": id})
})
```

### Query Parameters

```go
// URL: /search?q=golang&page=1
r.GET("/search", func(c *gin.Context) {
    query := c.Query("q")           // "golang"
    page := c.DefaultQuery("page", "1")  // "1" (with default)
    c.JSON(200, gin.H{"query": query, "page": page})
})
```

### Route Groups

```go
// Group related routes under a prefix
v1 := r.Group("/api/v1")
{
    v1.GET("/users", getUsers)      // /api/v1/users
    v1.POST("/users", createUser)   // /api/v1/users

    // Nested group
    auth := v1.Group("/auth")
    {
        auth.POST("/login", login)     // /api/v1/auth/login
        auth.POST("/register", register)
    }
}
```

## Request Handling

### Reading JSON Body

```go
type CreateUserRequest struct {
    Name     string `json:"name" binding:"required"`
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=6"`
}

r.POST("/users", func(c *gin.Context) {
    var req CreateUserRequest

    // Bind JSON and validate
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    // Use req.Name, req.Email, etc.
    c.JSON(201, gin.H{"message": "User created"})
})
```

### Reading Form Data

```go
r.POST("/upload", func(c *gin.Context) {
    name := c.PostForm("name")
    file, _ := c.FormFile("avatar")

    // Save file
    c.SaveUploadedFile(file, "./uploads/"+file.Filename)
})
```

### Reading Headers

```go
r.GET("/protected", func(c *gin.Context) {
    token := c.GetHeader("Authorization")
    if token == "" {
        c.JSON(401, gin.H{"error": "No token"})
        return
    }
    // Validate token...
})
```

## Response Handling

### JSON Response

```go
c.JSON(200, gin.H{
    "status": "success",
    "data": user,
})

// Or with a struct
c.JSON(200, user)
```

### Different Response Types

```go
c.JSON(200, data)           // JSON
c.XML(200, data)            // XML
c.String(200, "Hello")      // Plain text
c.HTML(200, "index.html", data)  // HTML template
c.Redirect(302, "/login")   // Redirect
c.File("./files/doc.pdf")   // File download
```

### Status Codes

```go
c.Status(204)               // No content
c.JSON(201, created)        // Created
c.JSON(400, gin.H{"error": "Bad request"})
c.JSON(401, gin.H{"error": "Unauthorized"})
c.JSON(404, gin.H{"error": "Not found"})
c.JSON(500, gin.H{"error": "Server error"})
```

## Middleware

Middleware functions run before/after handlers:

```go
// Custom middleware
func Logger() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()

        c.Next()  // Process request

        // After request
        duration := time.Since(start)
        log.Printf("%s %s %d %v", c.Request.Method, c.Request.URL.Path, c.Writer.Status(), duration)
    }
}

// Auth middleware
func AuthRequired() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
            return
        }

        // Validate token and set user in context
        user, err := validateToken(token)
        if err != nil {
            c.AbortWithStatusJSON(401, gin.H{"error": "Invalid token"})
            return
        }

        c.Set("user", user)  // Store for later handlers
        c.Next()
    }
}

// Use middleware
r.Use(Logger())  // Global

// Or per-group
protected := r.Group("/api")
protected.Use(AuthRequired())
{
    protected.GET("/profile", getProfile)
}
```

### Built-in Middleware

```go
r := gin.New()  // Empty router

r.Use(gin.Logger())    // Request logging
r.Use(gin.Recovery())  // Panic recovery

// gin.Default() = gin.New() + Logger + Recovery
```

## Context (gin.Context)

The context (`c *gin.Context`) is passed to every handler and contains:

```go
func handler(c *gin.Context) {
    // Request info
    c.Request.Method     // GET, POST, etc.
    c.Request.URL.Path   // /users/123
    c.Request.Header     // All headers

    // Read request
    c.Param("id")        // Route parameter
    c.Query("page")      // Query string
    c.PostForm("name")   // Form data
    c.ShouldBindJSON(&data)  // JSON body

    // Store/retrieve data (between middleware)
    c.Set("user", user)
    user := c.MustGet("user").(User)

    // Response
    c.JSON(200, data)
    c.String(200, "text")
    c.Redirect(302, "/")
    c.AbortWithStatus(403)
}
```

## CORS Setup

```go
import "github.com/gin-contrib/cors"

r.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:5173"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
    AllowHeaders:     []string{"Content-Type", "Authorization"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
    MaxAge:           12 * time.Hour,
}))
```

## Typical Handler Pattern

```go
func CreateUser(c *gin.Context) {
    // 1. Parse request
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": "Invalid request", "details": err.Error()})
        return
    }

    // 2. Business logic (call service)
    user, err := userService.Create(req.Name, req.Email, req.Password)
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to create user"})
        return
    }

    // 3. Return response
    c.JSON(201, gin.H{
        "message": "User created",
        "data":    user,
    })
}
```
