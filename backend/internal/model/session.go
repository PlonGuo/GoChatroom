package model

import (
	"database/sql"
	"time"

	"gorm.io/gorm"
)

// Session represents a chat session between users or within a group
type Session struct {
	ID            int64          `gorm:"primaryKey;autoIncrement" json:"id"`
	UUID          string         `gorm:"type:varchar(20);uniqueIndex;not null" json:"uuid"`
	SendID        string         `gorm:"type:varchar(20);not null;index" json:"sendId"`       // Session owner (viewer)
	ReceiveID     string         `gorm:"type:varchar(20);not null;index" json:"receiveId"`    // Contact UUID (user or group)
	ReceiveName   string         `gorm:"type:varchar(50)" json:"receiveName"`              // Display name
	Avatar        string         `gorm:"type:varchar(255);default:'https://api.dicebear.com/7.x/avataaars/svg'" json:"avatar"`
	LastMessage   string         `gorm:"type:text" json:"lastMessage"`
	LastMessageAt sql.NullTime   `json:"lastMessageAt"`
	UnreadCount   int            `gorm:"default:0" json:"unreadCount"`
	CreatedAt     time.Time      `gorm:"index" json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for Session model
func (Session) TableName() string {
	return "sessions"
}
