package contact

import (
	"errors"
	"fmt"
	"time"

	"github.com/PlonGuo/GoChatroom/backend/internal/database"
	"github.com/PlonGuo/GoChatroom/backend/internal/model"
	"github.com/PlonGuo/GoChatroom/backend/internal/service/chat"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrAlreadyFriends    = errors.New("already friends")
	ErrPendingRequest    = errors.New("pending friend request exists")
	ErrContactNotFound   = errors.New("contact not found")
	ErrRequestNotFound   = errors.New("request not found")
	ErrCannotAddSelf     = errors.New("cannot add yourself as contact")
)

// ApplyRequest contains friend request data
type ApplyRequest struct {
	ContactID string `json:"contactId" binding:"required"`
	Message   string `json:"message"`
}

// ContactResponse contains contact data for API response
type ContactResponse struct {
	UUID      string `json:"uuid"`
	Nickname  string `json:"nickname"`
	Avatar    string `json:"avatar"`
	Signature string `json:"signature"`
	Status    int8   `json:"status"`
}

// ApplyResponse contains friend request data for API response
type ApplyResponse struct {
	UUID        string `json:"uuid"`
	UserID      string `json:"userId"`
	UserName    string `json:"userName"`
	UserAvatar  string `json:"userAvatar"`
	ContactID   string `json:"contactId"`
	ContactType int8   `json:"contactType"`
	Status      int8   `json:"status"`
	Message     string `json:"message"`
	CreatedAt   string `json:"createdAt"`
}

// SendFriendRequest creates a friend request
func SendFriendRequest(userID string, req ApplyRequest) error {
	if userID == req.ContactID {
		return ErrCannotAddSelf
	}

	// Check if already friends
	var existing model.Contact
	if err := database.DB.Where("user_id = ? AND contact_id = ? AND contact_type = ?",
		userID, req.ContactID, model.ContactTypeUser).First(&existing).Error; err == nil {
		if existing.Status == model.ContactStatusNormal {
			return ErrAlreadyFriends
		}
	}

	// Check if pending request exists
	var pendingApply model.ContactApply
	if err := database.DB.Where("user_id = ? AND contact_id = ? AND status = ?",
		userID, req.ContactID, model.ContactApplyStatusPending).First(&pendingApply).Error; err == nil {
		return ErrPendingRequest
	}

	// Create friend request
	apply := model.ContactApply{
		UUID:        "A" + uuid.New().String()[:11],
		UserID:      userID,
		ContactID:   req.ContactID,
		ContactType: model.ContactTypeUser,
		Status:      model.ContactApplyStatusPending,
		Message:     req.Message,
	}

	if err := database.DB.Create(&apply).Error; err != nil {
		return fmt.Errorf("failed to create friend request: %w", err)
	}

	// Send WebSocket notification to recipient
	hub := chat.GetHub()
	hub.SendToUser(req.ContactID, chat.WSResponse{
		Type: "friend_request",
		Data: map[string]interface{}{
			"uuid":      apply.UUID,
			"userId":    userID,
			"contactId": req.ContactID,
			"message":   req.Message,
		},
		Timestamp: time.Now().Unix(),
	})

	return nil
}

// AcceptFriendRequest accepts a friend request
func AcceptFriendRequest(applyUUID, userID string) error {
	var apply model.ContactApply
	if err := database.DB.Where("uuid = ?", applyUUID).First(&apply).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrRequestNotFound
		}
		return err
	}

	// Verify the request is for this user
	if apply.ContactID != userID {
		return ErrRequestNotFound
	}

	if apply.Status != model.ContactApplyStatusPending {
		return errors.New("request already processed")
	}

	// Start transaction
	tx := database.DB.Begin()

	// Update apply status
	if err := tx.Model(&apply).Update("status", model.ContactApplyStatusApproved).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Create mutual contacts
	contact1 := model.Contact{
		UserID:      apply.UserID,
		ContactID:   apply.ContactID,
		ContactType: model.ContactTypeUser,
		Status:      model.ContactStatusNormal,
	}
	contact2 := model.Contact{
		UserID:      apply.ContactID,
		ContactID:   apply.UserID,
		ContactType: model.ContactTypeUser,
		Status:      model.ContactStatusNormal,
	}

	if err := tx.Create(&contact1).Error; err != nil {
		tx.Rollback()
		return err
	}
	if err := tx.Create(&contact2).Error; err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()

	// Send WebSocket notification to the requester (person who sent the request)
	hub := chat.GetHub()
	hub.SendToUser(apply.UserID, chat.WSResponse{
		Type: "friend_request_accepted",
		Data: map[string]interface{}{
			"uuid":      apply.UUID,
			"userId":    apply.UserID,
			"contactId": apply.ContactID,
		},
		Timestamp: time.Now().Unix(),
	})

	return nil
}

// RejectFriendRequest rejects a friend request
func RejectFriendRequest(applyUUID, userID string) error {
	var apply model.ContactApply
	if err := database.DB.Where("uuid = ?", applyUUID).First(&apply).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrRequestNotFound
		}
		return err
	}

	// Verify the request is for this user
	if apply.ContactID != userID {
		return ErrRequestNotFound
	}

	if apply.Status != model.ContactApplyStatusPending {
		return errors.New("request already processed")
	}

	return database.DB.Model(&apply).Update("status", model.ContactApplyStatusRejected).Error
}

// GetPendingRequests returns all pending friend requests for a user
func GetPendingRequests(userID string) ([]ApplyResponse, error) {
	var applies []model.ContactApply
	if err := database.DB.Where("contact_id = ? AND status = ?", userID, model.ContactApplyStatusPending).
		Order("created_at DESC").
		Find(&applies).Error; err != nil {
		return nil, err
	}

	if len(applies) == 0 {
		return []ApplyResponse{}, nil
	}

	// Get user info for requesters
	userIDs := make([]string, len(applies))
	for i, a := range applies {
		userIDs[i] = a.UserID
	}

	var users []model.User
	database.DB.Where("uuid IN ?", userIDs).Select("uuid", "nickname", "avatar").Find(&users)

	userMap := make(map[string]model.User)
	for _, u := range users {
		userMap[u.UUID] = u
	}

	result := make([]ApplyResponse, 0, len(applies))
	for _, a := range applies {
		user := userMap[a.UserID]
		result = append(result, ApplyResponse{
			UUID:        a.UUID,
			UserID:      a.UserID,
			UserName:    user.Nickname,
			UserAvatar:  user.Avatar,
			ContactID:   a.ContactID,
			ContactType: a.ContactType,
			Status:      a.Status,
			Message:     a.Message,
			CreatedAt:   a.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return result, nil
}

// GetSentRequests returns all friend requests sent by a user
func GetSentRequests(userID string) ([]ApplyResponse, error) {
	var applies []model.ContactApply
	if err := database.DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&applies).Error; err != nil {
		return nil, err
	}

	if len(applies) == 0 {
		return []ApplyResponse{}, nil
	}

	result := make([]ApplyResponse, 0, len(applies))
	for _, a := range applies {
		result = append(result, ApplyResponse{
			UUID:        a.UUID,
			UserID:      a.UserID,
			ContactID:   a.ContactID,
			ContactType: a.ContactType,
			Status:      a.Status,
			Message:     a.Message,
			CreatedAt:   a.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	return result, nil
}

// GetContacts returns all contacts for a user
func GetContacts(userID string) ([]ContactResponse, error) {
	var contacts []model.Contact
	if err := database.DB.Where("user_id = ? AND contact_type = ? AND status = ?",
		userID, model.ContactTypeUser, model.ContactStatusNormal).
		Find(&contacts).Error; err != nil {
		return nil, err
	}

	if len(contacts) == 0 {
		return []ContactResponse{}, nil
	}

	contactIDs := make([]string, len(contacts))
	for i, c := range contacts {
		contactIDs[i] = c.ContactID
	}

	var users []model.User
	if err := database.DB.Where("uuid IN ?", contactIDs).
		Select("uuid", "nickname", "avatar", "signature").
		Find(&users).Error; err != nil {
		return nil, err
	}

	result := make([]ContactResponse, 0, len(users))
	for _, u := range users {
		result = append(result, ContactResponse{
			UUID:      u.UUID,
			Nickname:  u.Nickname,
			Avatar:    u.Avatar,
			Signature: u.Signature,
			Status:    model.ContactStatusNormal,
		})
	}

	return result, nil
}

// DeleteContact removes a contact (unfriend)
func DeleteContact(userID, contactID string) error {
	// Update status for both directions
	if err := database.DB.Model(&model.Contact{}).
		Where("user_id = ? AND contact_id = ?", userID, contactID).
		Update("status", model.ContactStatusDeleted).Error; err != nil {
		return err
	}

	database.DB.Model(&model.Contact{}).
		Where("user_id = ? AND contact_id = ?", contactID, userID).
		Update("status", model.ContactStatusDeletedBy)

	return nil
}

// BlockContact blocks a contact
func BlockContact(userID, contactID string) error {
	return database.DB.Model(&model.Contact{}).
		Where("user_id = ? AND contact_id = ?", userID, contactID).
		Update("status", model.ContactStatusBlacklisted).Error
}

// UnblockContact unblocks a contact
func UnblockContact(userID, contactID string) error {
	return database.DB.Model(&model.Contact{}).
		Where("user_id = ? AND contact_id = ?", userID, contactID).
		Update("status", model.ContactStatusNormal).Error
}
