# GORM Database ORM

## What is GORM?

GORM is the most popular ORM (Object-Relational Mapping) for Go. It lets you:
- Define database tables as Go structs
- Query the database using Go methods instead of raw SQL
- Handle migrations automatically
- Manage relationships between tables

## Connecting to Database

```go
import (
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

// Connection string
dsn := "user:password@tcp(localhost:3306)/dbname?charset=utf8mb4&parseTime=True&loc=Local"

// Open connection
db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
if err != nil {
    log.Fatal(err)
}

// Get underlying sql.DB for connection pooling
sqlDB, _ := db.DB()
sqlDB.SetMaxIdleConns(10)      // Idle connections in pool
sqlDB.SetMaxOpenConns(100)     // Max open connections
sqlDB.SetConnMaxLifetime(time.Hour)  // Connection lifetime
```

## Defining Models

Models are Go structs with GORM tags:

```go
type User struct {
    ID        int64          `gorm:"primaryKey;autoIncrement"`
    UUID      string         `gorm:"type:char(20);uniqueIndex;not null"`
    Nickname  string         `gorm:"type:varchar(50);not null"`
    Email     string         `gorm:"type:varchar(100);uniqueIndex"`
    Password  string         `gorm:"type:varchar(100);not null"`
    Status    int8           `gorm:"type:tinyint;default:0;index"`
    CreatedAt time.Time      `gorm:"index"`
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt `gorm:"index"`  // Soft delete
}

// Custom table name
func (User) TableName() string {
    return "users"
}
```

### Common GORM Tags

```go
`gorm:"primaryKey"`           // Primary key
`gorm:"autoIncrement"`        // Auto increment
`gorm:"uniqueIndex"`          // Unique + indexed
`gorm:"index"`                // Create index
`gorm:"not null"`             // NOT NULL constraint
`gorm:"default:0"`            // Default value
`gorm:"type:varchar(100)"`    // Column type
`gorm:"column:user_name"`     // Custom column name
`gorm:"-"`                    // Ignore field
```

### JSON Tags

Use JSON tags for API responses:

```go
type User struct {
    ID       int64  `gorm:"primaryKey" json:"id"`
    Password string `gorm:"..." json:"-"`  // Hide in JSON
}
```

## Migrations

Auto-migrate creates/updates tables to match your models:

```go
// Create/update tables
db.AutoMigrate(&User{}, &Group{}, &Message{})

// This will:
// - Create tables if they don't exist
// - Add new columns
// - Create indexes
// - NOT delete columns (safe)
```

## CRUD Operations

### Create

```go
// Create single record
user := User{UUID: "abc123", Nickname: "John", Email: "john@example.com"}
result := db.Create(&user)
// user.ID is now set
fmt.Println(user.ID)
fmt.Println(result.RowsAffected)  // 1

// Create multiple
users := []User{{...}, {...}}
db.Create(&users)
```

### Read (Query)

```go
// Find by primary key
var user User
db.First(&user, 1)  // SELECT * FROM users WHERE id = 1

// Find by UUID
db.First(&user, "uuid = ?", "abc123")

// Find all
var users []User
db.Find(&users)

// With conditions
db.Where("status = ?", 0).Find(&users)
db.Where("email LIKE ?", "%@gmail.com").Find(&users)

// Multiple conditions
db.Where("status = ? AND created_at > ?", 0, yesterday).Find(&users)

// Or use struct
db.Where(&User{Status: 0}).Find(&users)

// Select specific columns
db.Select("id", "nickname").Find(&users)

// Order and limit
db.Order("created_at DESC").Limit(10).Offset(20).Find(&users)

// Count
var count int64
db.Model(&User{}).Where("status = ?", 0).Count(&count)
```

### Update

```go
// Update single field
db.Model(&user).Update("nickname", "Jane")

// Update multiple fields
db.Model(&user).Updates(User{Nickname: "Jane", Email: "jane@example.com"})

// Or using map
db.Model(&user).Updates(map[string]interface{}{
    "nickname": "Jane",
    "status":   1,
})

// Update with conditions
db.Model(&User{}).Where("status = ?", 1).Update("status", 0)
```

### Delete

```go
// Soft delete (if model has DeletedAt field)
db.Delete(&user)
// Sets DeletedAt, doesn't actually delete

// Permanent delete
db.Unscoped().Delete(&user)

// Delete by condition
db.Where("status = ?", 1).Delete(&User{})
```

## Advanced Queries

### Raw SQL

```go
var users []User
db.Raw("SELECT * FROM users WHERE status = ?", 0).Scan(&users)

// Execute
db.Exec("UPDATE users SET status = ? WHERE id = ?", 1, 100)
```

### Transactions

```go
tx := db.Begin()

if err := tx.Create(&user).Error; err != nil {
    tx.Rollback()
    return err
}

if err := tx.Create(&session).Error; err != nil {
    tx.Rollback()
    return err
}

tx.Commit()

// Or simpler:
db.Transaction(func(tx *gorm.DB) error {
    if err := tx.Create(&user).Error; err != nil {
        return err  // Auto rollback
    }
    if err := tx.Create(&session).Error; err != nil {
        return err  // Auto rollback
    }
    return nil  // Auto commit
})
```

### Preloading (Eager Loading)

```go
type User struct {
    ID       int64
    Messages []Message  // Has many
}

type Message struct {
    ID     int64
    UserID int64  // Foreign key
}

// Load user with all messages
var user User
db.Preload("Messages").First(&user, 1)

// With conditions
db.Preload("Messages", "status = ?", 1).First(&user, 1)
```

### Scopes (Reusable Queries)

```go
func Active(db *gorm.DB) *gorm.DB {
    return db.Where("status = ?", 0)
}

func Recent(db *gorm.DB) *gorm.DB {
    return db.Order("created_at DESC").Limit(10)
}

// Use scopes
db.Scopes(Active, Recent).Find(&users)
```

## Error Handling

```go
result := db.First(&user, 1)

if result.Error != nil {
    if errors.Is(result.Error, gorm.ErrRecordNotFound) {
        // Handle not found
    }
    // Handle other errors
}

// Or check rows affected
if result.RowsAffected == 0 {
    // No records found/affected
}
```

## Best Practices

1. **Always handle errors**
   ```go
   if err := db.Create(&user).Error; err != nil {
       return err
   }
   ```

2. **Use transactions for related operations**
   ```go
   db.Transaction(func(tx *gorm.DB) error {
       // Multiple operations
   })
   ```

3. **Select only needed columns**
   ```go
   db.Select("id", "name").Find(&users)
   ```

4. **Use indexes for frequently queried fields**
   ```go
   `gorm:"index"`
   ```

5. **Use soft deletes for important data**
   ```go
   DeletedAt gorm.DeletedAt `gorm:"index"`
   ```
