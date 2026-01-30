package group

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/PlonGuo/GoChatroom/backend/internal/database"
	"github.com/PlonGuo/GoChatroom/backend/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrGroupNotFound    = errors.New("group not found")
	ErrNotGroupOwner    = errors.New("not group owner")
	ErrAlreadyInGroup   = errors.New("already in group")
	ErrNotInGroup       = errors.New("not in group")
	ErrGroupDissolved   = errors.New("group has been dissolved")
)

// CreateRequest contains data for creating a group
type CreateRequest struct {
	Name    string `json:"name" binding:"required,min=2,max=50"`
	Notice  string `json:"notice"`
	AddMode int8   `json:"addMode"` // 0: direct join, 1: approval required
}

// UpdateRequest contains data for updating a group
type UpdateRequest struct {
	Name    *string `json:"name"`
	Notice  *string `json:"notice"`
	Avatar  *string `json:"avatar"`
	AddMode *int8   `json:"addMode"`
}

// GroupResponse contains group data for API response
type GroupResponse struct {
	UUID      string   `json:"uuid"`
	Name      string   `json:"name"`
	Notice    string   `json:"notice"`
	Avatar    string   `json:"avatar"`
	OwnerID   string   `json:"ownerId"`
	AddMode   int8     `json:"addMode"`
	MemberCnt int      `json:"memberCnt"`
	Members   []string `json:"members"`
	CreatedAt string   `json:"createdAt"`
}

// Create creates a new group
func Create(ownerID string, req CreateRequest) (*GroupResponse, error) {
	groupUUID := "G" + uuid.New().String()[:11]

	// Initial member list (just the owner)
	members := []string{ownerID}
	membersJSON, _ := json.Marshal(members)

	group := model.Group{
		UUID:      groupUUID,
		Name:      req.Name,
		Notice:    req.Notice,
		OwnerID:   ownerID,
		AddMode:   req.AddMode,
		Avatar:    fmt.Sprintf("https://api.dicebear.com/7.x/identicon/svg?seed=%s", groupUUID),
		Members:   membersJSON,
		MemberCnt: 1,
		Status:    model.GroupStatusActive,
	}

	if err := database.DB.Create(&group).Error; err != nil {
		return nil, fmt.Errorf("failed to create group: %w", err)
	}

	// Create contact entry for owner
	contact := model.Contact{
		UserID:      ownerID,
		ContactID:   groupUUID,
		ContactType: model.ContactTypeGroup,
		Status:      model.ContactStatusNormal,
	}
	database.DB.Create(&contact)

	return toGroupResponse(&group), nil
}

// GetByUUID retrieves a group by UUID
func GetByUUID(uuid string) (*model.Group, error) {
	var group model.Group
	if err := database.DB.Where("uuid = ?", uuid).First(&group).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrGroupNotFound
		}
		return nil, err
	}
	if group.Status == model.GroupStatusDissolved {
		return nil, ErrGroupDissolved
	}
	return &group, nil
}

// Update updates group info (owner only)
func Update(groupUUID, userID string, req UpdateRequest) (*GroupResponse, error) {
	group, err := GetByUUID(groupUUID)
	if err != nil {
		return nil, err
	}

	if group.OwnerID != userID {
		return nil, ErrNotGroupOwner
	}

	updates := make(map[string]interface{})
	if req.Name != nil && *req.Name != "" {
		updates["name"] = *req.Name
	}
	if req.Notice != nil {
		updates["notice"] = *req.Notice
	}
	if req.Avatar != nil && *req.Avatar != "" {
		updates["avatar"] = *req.Avatar
	}
	if req.AddMode != nil {
		updates["add_mode"] = *req.AddMode
	}

	if len(updates) > 0 {
		if err := database.DB.Model(&model.Group{}).Where("uuid = ?", groupUUID).Updates(updates).Error; err != nil {
			return nil, fmt.Errorf("failed to update group: %w", err)
		}
	}

	// Reload group
	group, _ = GetByUUID(groupUUID)
	return toGroupResponse(group), nil
}

// Dissolve dissolves a group (owner only)
func Dissolve(groupUUID, userID string) error {
	group, err := GetByUUID(groupUUID)
	if err != nil {
		return err
	}

	if group.OwnerID != userID {
		return ErrNotGroupOwner
	}

	// Mark group as dissolved
	if err := database.DB.Model(&model.Group{}).Where("uuid = ?", groupUUID).Update("status", model.GroupStatusDissolved).Error; err != nil {
		return fmt.Errorf("failed to dissolve group: %w", err)
	}

	// Update all member contacts
	database.DB.Model(&model.Contact{}).
		Where("contact_id = ? AND contact_type = ?", groupUUID, model.ContactTypeGroup).
		Update("status", model.ContactStatusLeftGroup)

	return nil
}

// AddMember adds a user to a group
func AddMember(groupUUID, userID string) error {
	group, err := GetByUUID(groupUUID)
	if err != nil {
		return err
	}

	// Check if already a member
	var members []string
	json.Unmarshal(group.Members, &members)
	for _, m := range members {
		if m == userID {
			return ErrAlreadyInGroup
		}
	}

	// Add to members
	members = append(members, userID)
	membersJSON, _ := json.Marshal(members)

	// Update group
	if err := database.DB.Model(&model.Group{}).Where("uuid = ?", groupUUID).Updates(map[string]interface{}{
		"members":    membersJSON,
		"member_cnt": len(members),
	}).Error; err != nil {
		return fmt.Errorf("failed to add member: %w", err)
	}

	// Create contact entry
	contact := model.Contact{
		UserID:      userID,
		ContactID:   groupUUID,
		ContactType: model.ContactTypeGroup,
		Status:      model.ContactStatusNormal,
	}
	database.DB.Create(&contact)

	return nil
}

// RemoveMember removes a user from a group (owner kicks or user leaves)
func RemoveMember(groupUUID, userID, removerID string) error {
	group, err := GetByUUID(groupUUID)
	if err != nil {
		return err
	}

	// Only owner can kick others, anyone can remove themselves
	if userID != removerID && group.OwnerID != removerID {
		return ErrNotGroupOwner
	}

	// Owner cannot be removed
	if userID == group.OwnerID {
		return errors.New("owner cannot leave group, dissolve instead")
	}

	var members []string
	json.Unmarshal(group.Members, &members)

	// Find and remove member
	found := false
	for i, m := range members {
		if m == userID {
			members = append(members[:i], members[i+1:]...)
			found = true
			break
		}
	}
	if !found {
		return ErrNotInGroup
	}

	membersJSON, _ := json.Marshal(members)

	// Update group
	if err := database.DB.Model(&model.Group{}).Where("uuid = ?", groupUUID).Updates(map[string]interface{}{
		"members":    membersJSON,
		"member_cnt": len(members),
	}).Error; err != nil {
		return fmt.Errorf("failed to remove member: %w", err)
	}

	// Update contact status
	status := model.ContactStatusLeftGroup
	if userID != removerID {
		status = model.ContactStatusKicked
	}
	database.DB.Model(&model.Contact{}).
		Where("user_id = ? AND contact_id = ?", userID, groupUUID).
		Update("status", status)

	return nil
}

// GetMembers returns all members of a group with their profiles
func GetMembers(groupUUID string) ([]map[string]interface{}, error) {
	group, err := GetByUUID(groupUUID)
	if err != nil {
		return nil, err
	}

	var memberIDs []string
	json.Unmarshal(group.Members, &memberIDs)

	var users []model.User
	if err := database.DB.Where("uuid IN ?", memberIDs).
		Select("uuid", "nickname", "avatar").
		Find(&users).Error; err != nil {
		return nil, err
	}

	result := make([]map[string]interface{}, 0, len(users))
	for _, u := range users {
		result = append(result, map[string]interface{}{
			"uuid":     u.UUID,
			"nickname": u.Nickname,
			"avatar":   u.Avatar,
			"isOwner":  u.UUID == group.OwnerID,
		})
	}

	return result, nil
}

// Search searches groups by name
func Search(query string) ([]GroupResponse, error) {
	var groups []model.Group
	if err := database.DB.Where("name LIKE ? AND status = ?", "%"+query+"%", model.GroupStatusActive).
		Limit(20).
		Find(&groups).Error; err != nil {
		return nil, err
	}

	result := make([]GroupResponse, 0, len(groups))
	for _, g := range groups {
		result = append(result, *toGroupResponse(&g))
	}
	return result, nil
}

// GetUserGroups returns all groups a user is a member of
func GetUserGroups(userID string) ([]GroupResponse, error) {
	var contacts []model.Contact
	if err := database.DB.Where("user_id = ? AND contact_type = ? AND status = ?",
		userID, model.ContactTypeGroup, model.ContactStatusNormal).
		Find(&contacts).Error; err != nil {
		return nil, err
	}

	if len(contacts) == 0 {
		return []GroupResponse{}, nil
	}

	groupIDs := make([]string, len(contacts))
	for i, c := range contacts {
		groupIDs[i] = c.ContactID
	}

	var groups []model.Group
	if err := database.DB.Where("uuid IN ? AND status = ?", groupIDs, model.GroupStatusActive).
		Find(&groups).Error; err != nil {
		return nil, err
	}

	result := make([]GroupResponse, 0, len(groups))
	for _, g := range groups {
		result = append(result, *toGroupResponse(&g))
	}
	return result, nil
}

func toGroupResponse(g *model.Group) *GroupResponse {
	var members []string
	json.Unmarshal(g.Members, &members)

	return &GroupResponse{
		UUID:      g.UUID,
		Name:      g.Name,
		Notice:    g.Notice,
		Avatar:    g.Avatar,
		OwnerID:   g.OwnerID,
		AddMode:   g.AddMode,
		MemberCnt: g.MemberCnt,
		Members:   members,
		CreatedAt: g.CreatedAt.Format("2006-01-02"),
	}
}
