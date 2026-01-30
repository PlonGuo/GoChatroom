# Redis Caching and Sessions

## What is Redis?

Redis is an in-memory data store used for:
- **Caching**: Store frequently accessed data
- **Sessions**: Store user login state
- **Rate limiting**: Track API request counts
- **Real-time features**: Pub/Sub for WebSocket messages
- **Queues**: Background job processing

## Why Use Redis?

| Storage | Speed | Persistence | Use Case |
|---------|-------|-------------|----------|
| MySQL | Slow | Yes | Permanent data |
| Redis | Very Fast | Optional | Temporary/cached data |

Redis stores data in RAM, making it 10-100x faster than disk-based databases.

## Connecting to Redis

```go
import "github.com/redis/go-redis/v9"

// Local Redis
client := redis.NewClient(&redis.Options{
    Addr:     "localhost:6379",
    Password: "",
    DB:       0,
})

// Upstash (cloud Redis) using URL
opts, _ := redis.ParseURL("rediss://default:xxx@xxx.upstash.io:6379")
client := redis.NewClient(opts)

// Test connection
err := client.Ping(ctx).Err()
```

## Basic Operations

### Strings (Key-Value)

```go
ctx := context.Background()

// SET key value [EX seconds]
err := client.Set(ctx, "user:123:name", "John", time.Hour).Err()

// GET key
name, err := client.Get(ctx, "user:123:name").Result()
if err == redis.Nil {
    // Key doesn't exist
}

// DELETE
client.Del(ctx, "user:123:name")

// Check existence
exists, _ := client.Exists(ctx, "user:123:name").Result()

// Set expiration
client.Expire(ctx, "user:123:name", time.Hour)
```

### Hashes (Objects)

Perfect for storing user sessions or cached objects:

```go
// HSET key field value
client.HSet(ctx, "session:abc123", "user_id", "123")
client.HSet(ctx, "session:abc123", "nickname", "John")

// Or set multiple
client.HSet(ctx, "session:abc123", map[string]interface{}{
    "user_id":  "123",
    "nickname": "John",
    "role":     "user",
})

// HGET key field
userId, _ := client.HGet(ctx, "session:abc123", "user_id").Result()

// HGETALL key
session, _ := client.HGetAll(ctx, "session:abc123").Result()
// session = {"user_id": "123", "nickname": "John", "role": "user"}

// HDEL key field
client.HDel(ctx, "session:abc123", "role")
```

### Lists (Queues)

```go
// LPUSH (add to front)
client.LPush(ctx, "notifications:123", "New message")

// RPUSH (add to back)
client.RPush(ctx, "notifications:123", "New message")

// LPOP (remove from front)
msg, _ := client.LPop(ctx, "notifications:123").Result()

// LRANGE (get range)
msgs, _ := client.LRange(ctx, "notifications:123", 0, 9).Result()
```

### Sets (Unique Values)

```go
// SADD (add members)
client.SAdd(ctx, "online_users", "user:123", "user:456")

// SMEMBERS (get all)
users, _ := client.SMembers(ctx, "online_users").Result()

// SISMEMBER (check membership)
online, _ := client.SIsMember(ctx, "online_users", "user:123").Result()

// SREM (remove)
client.SRem(ctx, "online_users", "user:123")
```

## Common Use Cases

### 1. Session Storage

```go
// After login
func StoreSession(userID string, token string) {
    sessionKey := "session:" + token
    redis.Set(sessionKey, userID, 24*time.Hour)
}

// Validate session
func ValidateSession(token string) (string, error) {
    sessionKey := "session:" + token
    return redis.Get(sessionKey)
}

// Logout
func DestroySession(token string) {
    redis.Delete("session:" + token)
}
```

### 2. Rate Limiting

```go
func RateLimit(userID string, limit int) bool {
    key := "ratelimit:" + userID

    count, _ := redis.Incr(key)
    if count == 1 {
        redis.Expire(key, time.Minute)
    }

    return count <= limit
}
```

### 3. Caching Database Results

```go
func GetUser(userID string) (*User, error) {
    cacheKey := "user:" + userID

    // Try cache first
    cached, err := redis.Get(cacheKey)
    if err == nil {
        var user User
        json.Unmarshal([]byte(cached), &user)
        return &user, nil
    }

    // Cache miss - query database
    var user User
    db.First(&user, "uuid = ?", userID)

    // Store in cache
    data, _ := json.Marshal(user)
    redis.Set(cacheKey, string(data), time.Hour)

    return &user, nil
}
```

### 4. Online User Tracking

```go
func UserOnline(userID string) {
    redis.Set("online:"+userID, "1", 5*time.Minute)
}

func UserOffline(userID string) {
    redis.Delete("online:" + userID)
}

func IsOnline(userID string) bool {
    exists, _ := redis.Exists("online:" + userID)
    return exists
}
```

## Pub/Sub (Real-time)

Redis Pub/Sub is useful for WebSocket message distribution:

```go
// Publisher (send message)
func PublishMessage(channel string, message interface{}) {
    data, _ := json.Marshal(message)
    redis.Publish(channel, string(data))
}

// Subscriber (receive messages)
func Subscribe(channel string) {
    pubsub := redis.Subscribe(channel)
    ch := pubsub.Channel()

    for msg := range ch {
        fmt.Println(msg.Payload)
    }
}

// Usage
PublishMessage("chat:room:123", Message{
    Content: "Hello!",
    SenderId: "user:456",
})
```

## Key Naming Conventions

Use colons to create namespaces:

```
session:abc123              # User session
user:123:profile            # User profile cache
user:123:contacts           # User's contacts
room:456:messages           # Chat room messages
online:user:123             # Online status
ratelimit:api:user:123      # Rate limit counter
```

## Best Practices

1. **Set expiration on all keys**
   ```go
   redis.Set(key, value, 24*time.Hour)  // Always expire
   ```

2. **Use meaningful key names**
   ```go
   "user:123:session"  // Good
   "u123s"             // Bad
   ```

3. **Don't store too much data**
   - Redis stores everything in RAM
   - Use for temporary/cached data only

4. **Use appropriate data structures**
   - String: Single values
   - Hash: Objects with fields
   - List: Queues, recent items
   - Set: Unique collections

5. **Handle connection errors**
   ```go
   if err == redis.Nil {
       // Key doesn't exist (not an error)
   } else if err != nil {
       // Actual error
   }
   ```
