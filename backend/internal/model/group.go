package model

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// Group represents a chat group
type Group struct {
	ID        int64           `gorm:"primaryKey;autoIncrement" json:"id"`
	UUID      string          `gorm:"type:varchar(20);uniqueIndex;not null" json:"uuid"`
	Name      string          `gorm:"type:varchar(50);not null" json:"name"`
	Notice    string          `gorm:"type:varchar(500)" json:"notice"`
	Members   json.RawMessage `gorm:"type:jsonb" json:"members"`
	MemberCnt int             `gorm:"default:1" json:"memberCnt"`
	OwnerID   string          `gorm:"type:varchar(20);not null;index" json:"ownerId"`
	AddMode   int8            `gorm:"type:smallint;default:0" json:"addMode"` // 0: direct join, 1: approval required
	Avatar    string          `gorm:"type:varchar(255);default:'https://api.dicebear.com/7.x/identicon/svg'" json:"avatar"`
	Status    int8            `gorm:"type:smallint;default:0" json:"status"` // 0: active, 1: disabled, 2: dissolved
	CreatedAt time.Time       `gorm:"index" json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
	DeletedAt gorm.DeletedAt  `gorm:"index" json:"-"`
}

// TableName specifies the table name for Group model
func (Group) TableName() string {
	return "groups"
}

// GroupAddMode constants
const (
	GroupAddModeDirect   = 0
	GroupAddModeApproval = 1
)

// GroupStatus constants
const (
	GroupStatusActive    = 0
	GroupStatusDisabled  = 1
	GroupStatusDissolved = 2
)
