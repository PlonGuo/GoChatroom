package message

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/PlonGuo/GoChatroom/backend/internal/database"
	"github.com/PlonGuo/GoChatroom/backend/internal/model"
	"github.com/PlonGuo/GoChatroom/backend/internal/service/session"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrMessageNotFound = errors.New("message not found")
)

// CreateRequest contains data for creating a message
type CreateRequest struct {
	SessionID  string `json:"sessionId" binding:"required"`
	ReceiveID  string `json:"receiveId" binding:"required"`
	Type       int8   `json:"type"`                 // 0: text, 1: voice, 2: file, 3: image
	Content    string `json:"content"`
	URL        string `json:"url,omitempty"`
	FileType   string `json:"fileType,omitempty"`
	FileName   string `json:"fileName,omitempty"`
	FileSize   int64  `json:"fileSize,omitempty"`
}

// MessageResponse contains message data for API response
type MessageResponse struct {
	UUID       string `json:"uuid"`
	SessionID  string `json:"sessionId"`
	Type       int8   `json:"type"`
	Content    string `json:"content"`
	URL        string `json:"url,omitempty"`
	SendID     string `json:"sendId"`
	SendName   string `json:"sendName"`
	SendAvatar string `json:"sendAvatar"`
	ReceiveID  string `json:"receiveId"`
	FileType   string `json:"fileType,omitempty"`
	FileName   string `json:"fileName,omitempty"`
	FileSize   int64  `json:"fileSize,omitempty"`
	Status     int8   `json:"status"`
	CreatedAt  string `json:"createdAt"`
}

// Create creates a new message
func Create(userID, nickname, avatar string, req CreateRequest) (*MessageResponse, error) {
	msg := model.Message{
		UUID:       "M" + uuid.New().String()[:11],
		SessionID:  req.SessionID,
		Type:       req.Type,
		Content:    req.Content,
		URL:        req.URL,
		SendID:     userID,
		SendName:   nickname,
		SendAvatar: avatar,
		ReceiveID:  req.ReceiveID,
		FileType:   req.FileType,
		FileName:   req.FileName,
		FileSize:   req.FileSize,
		Status:     model.MessageStatusSent,
		SentAt:     sql.NullTime{Time: time.Now(), Valid: true},
	}

	if err := database.DB.Create(&msg).Error; err != nil {
		return nil, fmt.Errorf("failed to create message: %w", err)
	}

	// Update session last message
	displayContent := req.Content
	switch req.Type {
	case model.MessageTypeVoice:
		displayContent = "[Voice message]"
	case model.MessageTypeFile:
		displayContent = "[File: " + req.FileName + "]"
	case model.MessageTypeImage:
		displayContent = "[Image]"
	case model.MessageTypeVideoCall:
		displayContent = "[Video call]"
	}
	session.UpdateLastMessage(req.SessionID, displayContent)

	return toMessageResponse(&msg), nil
}

// GetBySessionID returns all messages for a session by looking up the session's participants
func GetBySessionID(sessionID string, limit, offset int) ([]MessageResponse, error) {
	if limit <= 0 {
		limit = 50
	}

	// First, get the session to find the participants
	sess, err := session.GetByUUID(sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	// Query messages between the two participants (both directions)
	var messages []model.Message
	if err := database.DB.Where(
		"(send_id = ? AND receive_id = ?) OR (send_id = ? AND receive_id = ?)",
		sess.SendID, sess.ReceiveID, sess.ReceiveID, sess.SendID,
	).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&messages).Error; err != nil {
		return nil, err
	}

	result := make([]MessageResponse, 0, len(messages))
	for _, m := range messages {
		result = append(result, *toMessageResponse(&m))
	}

	// Reverse to get chronological order
	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}

	return result, nil
}

// GetByUUID retrieves a message by UUID
func GetByUUID(uuid string) (*model.Message, error) {
	var msg model.Message
	if err := database.DB.Where("uuid = ?", uuid).First(&msg).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrMessageNotFound
		}
		return nil, err
	}
	return &msg, nil
}

// MarkAsRead marks a message as read
func MarkAsRead(messageUUID string) error {
	return database.DB.Model(&model.Message{}).
		Where("uuid = ?", messageUUID).
		Update("status", model.MessageStatusRead).Error
}

// MarkAllAsRead marks all messages in a session as read
func MarkAllAsRead(sessionUUID, userID string) error {
	// Get session
	sess, err := session.GetByUUID(sessionUUID)
	if err != nil {
		return err
	}

	// Mark messages sent to this user as read
	database.DB.Model(&model.Message{}).
		Where("session_id = ? AND receive_id = ? AND status < ?", sessionUUID, userID, model.MessageStatusRead).
		Update("status", model.MessageStatusRead)

	// Clear unread count for the session
	return session.ClearUnread(sess.UUID)
}

// GetUnreadCount returns the count of unread messages for a user
func GetUnreadCount(userID string) (int64, error) {
	var count int64
	if err := database.DB.Model(&model.Message{}).
		Where("receive_id = ? AND status < ?", userID, model.MessageStatusRead).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func toMessageResponse(m *model.Message) *MessageResponse {
	return &MessageResponse{
		UUID:       m.UUID,
		SessionID:  m.SessionID,
		Type:       m.Type,
		Content:    m.Content,
		URL:        m.URL,
		SendID:     m.SendID,
		SendName:   m.SendName,
		SendAvatar: m.SendAvatar,
		ReceiveID:  m.ReceiveID,
		FileType:   m.FileType,
		FileName:   m.FileName,
		FileSize:   m.FileSize,
		Status:     m.Status,
		CreatedAt:  m.CreatedAt.Format("2006-01-02 15:04:05"),
	}
}
