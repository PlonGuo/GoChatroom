package model

import (
	"database/sql"
	"time"
)

// Message represents a chat message
type Message struct {
	ID         int64        `gorm:"primaryKey;autoIncrement" json:"id"`
	UUID       string       `gorm:"type:char(20);uniqueIndex;not null" json:"uuid"`
	SessionID  string       `gorm:"type:char(20);not null;index" json:"sessionId"`
	Type       int8         `gorm:"type:tinyint;default:0" json:"type"`                 // 0: text, 1: voice, 2: file, 3: image, 4: video call
	Content    string       `gorm:"type:text" json:"content"`
	URL        string       `gorm:"type:varchar(255)" json:"url"`                       // File/media URL
	SendID     string       `gorm:"type:char(20);not null;index" json:"sendId"`
	SendName   string       `gorm:"type:varchar(50)" json:"sendName"`
	SendAvatar string       `gorm:"type:varchar(255)" json:"sendAvatar"`
	ReceiveID  string       `gorm:"type:char(20);not null;index" json:"receiveId"`
	FileType   string       `gorm:"type:varchar(20)" json:"fileType,omitempty"`
	FileName   string       `gorm:"type:varchar(100)" json:"fileName,omitempty"`
	FileSize   int64        `json:"fileSize,omitempty"`
	Status     int8         `gorm:"type:tinyint;default:0" json:"status"`               // 0: sent, 1: delivered, 2: read
	AVData     string       `gorm:"type:text" json:"avData,omitempty"`                  // WebRTC signaling data
	CreatedAt  time.Time    `gorm:"index" json:"createdAt"`
	SentAt     sql.NullTime `json:"sentAt"`
}

// TableName specifies the table name for Message model
func (Message) TableName() string {
	return "messages"
}

// MessageType constants
const (
	MessageTypeText      = 0
	MessageTypeVoice     = 1
	MessageTypeFile      = 2
	MessageTypeImage     = 3
	MessageTypeVideoCall = 4
)

// MessageStatus constants
const (
	MessageStatusSent      = 0
	MessageStatusDelivered = 1
	MessageStatusRead      = 2
)
