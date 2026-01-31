package model

import (
	"time"

	"gorm.io/gorm"
)

// ContactApply represents a friend or group join request
type ContactApply struct {
	ID          int64          `gorm:"primaryKey;autoIncrement" json:"id"`
	UUID        string         `gorm:"type:varchar(20);uniqueIndex;not null" json:"uuid"`
	UserID      string         `gorm:"type:varchar(20);not null;index" json:"userId"`      // Applicant
	ContactID   string         `gorm:"type:varchar(20);not null;index" json:"contactId"`   // Target user or group
	ContactType int8           `gorm:"type:smallint;not null" json:"contactType"`        // 0: user, 1: group
	Status      int8           `gorm:"type:smallint;default:0" json:"status"`            // 0: pending, 1: approved, 2: rejected, 3: blacklisted
	Message     string         `gorm:"type:varchar(200)" json:"message"`                // Application message
	LastApplyAt *time.Time     `json:"lastApplyAt"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for ContactApply model
func (ContactApply) TableName() string {
	return "contact_applies"
}

// ContactApplyStatus constants
const (
	ContactApplyStatusPending     = 0
	ContactApplyStatusApproved    = 1
	ContactApplyStatusRejected    = 2
	ContactApplyStatusBlacklisted = 3
)
