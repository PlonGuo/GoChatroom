# Go Language Basics

## Why Go for Backend?

Go (Golang) is excellent for web backends because:
- **Fast compilation**: Changes compile in seconds
- **Simple syntax**: Easy to read and maintain
- **Built-in concurrency**: Goroutines and channels for async operations
- **Static typing**: Catch errors at compile time
- **Single binary**: No runtime dependencies to deploy

## Essential Concepts

### Packages and Imports

Every Go file belongs to a package:

```go
package main  // Executable package

import (
    "fmt"                                    // Standard library
    "github.com/gin-gonic/gin"               // External package
    "github.com/PlonGuo/GoChatroom/backend/internal/config"  // Local package
)
```

### Variables and Types

```go
// Variable declaration
var name string = "John"
age := 25  // Short declaration (type inferred)

// Basic types
var (
    text   string  = "hello"
    number int     = 42
    pi     float64 = 3.14
    active bool    = true
)

// Slices (dynamic arrays)
names := []string{"Alice", "Bob"}
names = append(names, "Charlie")

// Maps (dictionaries)
scores := map[string]int{
    "Alice": 100,
    "Bob":   85,
}
```

### Structs (like classes)

```go
type User struct {
    ID       int64
    Name     string
    Email    string
    IsActive bool
}

// Create instance
user := User{
    ID:       1,
    Name:     "John",
    Email:    "john@example.com",
    IsActive: true,
}

// Access fields
fmt.Println(user.Name)  // John
```

### Methods (functions on structs)

```go
type User struct {
    Name string
}

// Method with receiver
func (u User) Greet() string {
    return "Hello, " + u.Name
}

// Pointer receiver (can modify the struct)
func (u *User) SetName(name string) {
    u.Name = name
}

user := User{Name: "John"}
fmt.Println(user.Greet())  // Hello, John
user.SetName("Jane")
fmt.Println(user.Name)     // Jane
```

### Interfaces

Interfaces define behavior (what methods a type must have):

```go
type Reader interface {
    Read(p []byte) (n int, err error)
}

// Any type with a Read method satisfies this interface
// Go uses implicit interface implementation (no "implements" keyword)
```

### Error Handling

Go doesn't have exceptions. Functions return errors explicitly:

```go
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("cannot divide by zero")
    }
    return a / b, nil
}

// Calling the function
result, err := divide(10, 0)
if err != nil {
    log.Fatal(err)  // Handle error
}
fmt.Println(result)
```

### Pointers

Pointers hold memory addresses:

```go
x := 10
p := &x    // p is a pointer to x
fmt.Println(*p)  // 10 (dereference to get value)

*p = 20    // Change value through pointer
fmt.Println(x)   // 20

// Why use pointers?
// 1. Modify variables in functions
// 2. Avoid copying large structs
// 3. Indicate optional values (nil pointer)
```

### Goroutines and Channels (Concurrency)

```go
// Goroutine: lightweight thread
go func() {
    fmt.Println("Running in background")
}()

// Channel: communication between goroutines
ch := make(chan string)

go func() {
    ch <- "Hello"  // Send to channel
}()

msg := <-ch  // Receive from channel
fmt.Println(msg)  // Hello
```

## Common Patterns in This Project

### Singleton Pattern (config)

```go
var instance *Config
var once sync.Once

func Get() *Config {
    once.Do(func() {
        instance = &Config{...}
    })
    return instance
}
```

### Error Wrapping

```go
if err != nil {
    return fmt.Errorf("failed to connect: %w", err)
}
```

### Deferred Cleanup

```go
func readFile() {
    file, _ := os.Open("data.txt")
    defer file.Close()  // Runs when function returns

    // Use file...
}
```

### Context for Cancellation

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

// Pass ctx to operations that should respect the timeout
result, err := db.QueryContext(ctx, "SELECT ...")
```

## Go Modules

`go.mod` defines the module and dependencies:

```
module github.com/PlonGuo/GoChatroom/backend

go 1.24.3

require (
    github.com/gin-gonic/gin v1.11.0
    gorm.io/gorm v1.25.12
)
```

Common commands:
```bash
go mod init <module-name>  # Create new module
go mod tidy                # Add missing, remove unused deps
go get <package>           # Add a dependency
go build                   # Compile
go run .                   # Run without building
```
