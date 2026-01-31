package model

import (
	"time"

	"gorm.io/gorm"
)

// Contact represents a user's contact (friend or group membership)
type Contact struct {
	ID          int64          `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID      string         `gorm:"type:varchar(20);not null;index" json:"userId"`
	ContactID   string         `gorm:"type:varchar(20);not null;index" json:"contactId"`
	ContactType int8           `gorm:"type:smallint;not null" json:"contactType"` // 0: user, 1: group
	Status      int8           `gorm:"type:smallint;default:0" json:"status"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for Contact model
func (Contact) TableName() string {
	return "contacts"
}

// ContactType constants
const (
	ContactTypeUser  = 0
	ContactTypeGroup = 1
)

// ContactStatus constants
const (
	ContactStatusNormal      = 0
	ContactStatusBlacklisted = 1
	ContactStatusBlocked     = 2
	ContactStatusDeleted     = 3
	ContactStatusDeletedBy   = 4
	ContactStatusMuted       = 5
	ContactStatusLeftGroup   = 6
	ContactStatusKicked      = 7
)
