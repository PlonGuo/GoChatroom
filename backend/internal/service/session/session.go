package session

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/PlonGuo/GoChatroom/backend/internal/database"
	"github.com/PlonGuo/GoChatroom/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrSessionNotFound = errors.New("session not found")
)

// SessionResponse contains session data for API response
type SessionResponse struct {
	UUID          string `json:"uuid"`
	ReceiveID     string `json:"receiveId"`
	ReceiveName   string `json:"receiveName"`
	Avatar        string `json:"avatar"`
	LastMessage   string `json:"lastMessage"`
	LastMessageAt string `json:"lastMessageAt,omitempty"`
	UnreadCount   int    `json:"unreadCount"`
	UpdatedAt     string `json:"updatedAt"`
}

// GetOrCreate gets an existing session or creates a new one
func GetOrCreate(userID, receiveID, receiveName, avatar string) (*model.Session, error) {
	var session model.Session

	// Try to find existing session
	err := database.DB.Where("send_id = ? AND receive_id = ?", userID, receiveID).First(&session).Error
	if err == nil {
		return &session, nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// Create new session
	session = model.Session{
		UUID:        "S" + uuid.New().String()[:11],
		SendID:      userID,
		ReceiveID:   receiveID,
		ReceiveName: receiveName,
		Avatar:      avatar,
	}

	if err := database.DB.Create(&session).Error; err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return &session, nil
}

// GetByUUID retrieves a session by UUID
func GetByUUID(uuid string) (*model.Session, error) {
	var session model.Session
	if err := database.DB.Where("uuid = ?", uuid).First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSessionNotFound
		}
		return nil, err
	}
	return &session, nil
}

// GetUserSessions returns all sessions for a user
func GetUserSessions(userID string) ([]SessionResponse, error) {
	var sessions []model.Session
	if err := database.DB.Where("send_id = ?", userID).
		Order("updated_at DESC").
		Find(&sessions).Error; err != nil {
		return nil, err
	}

	result := make([]SessionResponse, 0, len(sessions))
	for _, s := range sessions {
		resp := SessionResponse{
			UUID:        s.UUID,
			ReceiveID:   s.ReceiveID,
			ReceiveName: s.ReceiveName,
			Avatar:      s.Avatar,
			LastMessage: s.LastMessage,
			UnreadCount: s.UnreadCount,
			UpdatedAt:   s.UpdatedAt.Format("2006-01-02 15:04:05"),
		}
		if s.LastMessageAt.Valid {
			resp.LastMessageAt = s.LastMessageAt.Time.Format("2006-01-02 15:04:05")
		}
		result = append(result, resp)
	}

	return result, nil
}

// UpdateLastMessage updates the last message and timestamp for a session
func UpdateLastMessage(sessionUUID, content string) error {
	return database.DB.Model(&model.Session{}).
		Where("uuid = ?", sessionUUID).
		Updates(map[string]interface{}{
			"last_message":    content,
			"last_message_at": sql.NullTime{Time: time.Now(), Valid: true},
		}).Error
}

// IncrementUnread increments the unread count for a session
func IncrementUnread(sessionUUID string) error {
	return database.DB.Model(&model.Session{}).
		Where("uuid = ?", sessionUUID).
		Update("unread_count", gorm.Expr("unread_count + 1")).Error
}

// ClearUnread clears the unread count for a session
func ClearUnread(sessionUUID string) error {
	return database.DB.Model(&model.Session{}).
		Where("uuid = ?", sessionUUID).
		Update("unread_count", 0).Error
}

// Delete soft deletes a session
func Delete(sessionUUID, userID string) error {
	return database.DB.Where("uuid = ? AND send_id = ?", sessionUUID, userID).
		Delete(&model.Session{}).Error
}
