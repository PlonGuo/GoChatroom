package model

import (
	"database/sql"
	"time"

	"gorm.io/gorm"
)

// User represents a registered user in the system
type User struct {
	ID            int64          `gorm:"primaryKey;autoIncrement" json:"id"`
	UUID          string         `gorm:"type:varchar(20);uniqueIndex;not null" json:"uuid"`
	Nickname      string         `gorm:"type:varchar(50);not null" json:"nickname"`
	Email         string         `gorm:"type:varchar(100);uniqueIndex;not null" json:"email"`
	Password      string         `gorm:"type:varchar(100);not null" json:"-"`
	Avatar        string         `gorm:"type:varchar(255);default:'https://api.dicebear.com/7.x/avataaars/svg'" json:"avatar"`
	Gender        int8           `gorm:"type:smallint;default:0" json:"gender"` // 0: unspecified, 1: male, 2: female
	Signature     string         `gorm:"type:varchar(200)" json:"signature"`
	Birthday      string         `gorm:"type:varchar(10)" json:"birthday"` // YYYY-MM-DD format
	IsAdmin       bool           `gorm:"default:false" json:"isAdmin"`
	Status        int8           `gorm:"type:smallint;default:0;index" json:"status"` // 0: active, 1: disabled
	LastOnlineAt  sql.NullTime   `json:"lastOnlineAt"`
	LastOfflineAt sql.NullTime   `json:"lastOfflineAt"`
	CreatedAt     time.Time      `gorm:"index" json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}

// UserStatus constants
const (
	UserStatusActive   = 0
	UserStatusDisabled = 1
)

// Gender constants
const (
	GenderUnspecified = 0
	GenderMale        = 1
	GenderFemale      = 2
)
