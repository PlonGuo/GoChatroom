package handler

import (
	"errors"

	"github.com/PlonGuo/GoChatroom/backend/internal/database"
	"github.com/PlonGuo/GoChatroom/backend/internal/model"
	"github.com/PlonGuo/GoChatroom/backend/internal/service/user"
	"github.com/PlonGuo/GoChatroom/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// UpdateProfileRequest contains profile update data
type UpdateProfileRequest struct {
	Nickname  *string `json:"nickname"`
	Avatar    *string `json:"avatar"`
	Gender    *int8   `json:"gender"`
	Signature *string `json:"signature"`
	Birthday  *string `json:"birthday"`
}

// UpdatePasswordRequest contains password change data
type UpdatePasswordRequest struct {
	OldPassword string `json:"oldPassword" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=6"`
}

// GetUser returns a user by UUID
func GetUser(c *gin.Context) {
	uuid := c.Param("uuid")
	if uuid == "" {
		response.BadRequest(c, "User UUID is required")
		return
	}

	userModel, err := user.GetByUUID(uuid)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			response.NotFound(c, "User not found")
			return
		}
		response.InternalError(c, "Failed to get user")
		return
	}

	profile := gin.H{
		"uuid":      userModel.UUID,
		"nickname":  userModel.Nickname,
		"avatar":    userModel.Avatar,
		"gender":    userModel.Gender,
		"signature": userModel.Signature,
	}

	response.Success(c, profile)
}

// UpdateProfile updates the current user's profile
func UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	// Build update map
	updates := make(map[string]interface{})
	if req.Nickname != nil && *req.Nickname != "" {
		updates["nickname"] = *req.Nickname
	}
	if req.Avatar != nil && *req.Avatar != "" {
		updates["avatar"] = *req.Avatar
	}
	if req.Gender != nil {
		updates["gender"] = *req.Gender
	}
	if req.Signature != nil {
		updates["signature"] = *req.Signature
	}
	if req.Birthday != nil {
		updates["birthday"] = *req.Birthday
	}

	if len(updates) == 0 {
		response.BadRequest(c, "No fields to update")
		return
	}

	// Update user
	if err := database.DB.Model(&model.User{}).Where("uuid = ?", userID).Updates(updates).Error; err != nil {
		response.InternalError(c, "Failed to update profile")
		return
	}

	// Get updated user
	userModel, _ := user.GetByUUID(userID.(string))

	response.Success(c, gin.H{
		"uuid":      userModel.UUID,
		"nickname":  userModel.Nickname,
		"email":     userModel.Email,
		"avatar":    userModel.Avatar,
		"gender":    userModel.Gender,
		"signature": userModel.Signature,
		"birthday":  userModel.Birthday,
	})
}

// UpdatePassword changes the current user's password
func UpdatePassword(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req UpdatePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	// Get current user
	userModel, err := user.GetByUUID(userID.(string))
	if err != nil {
		response.InternalError(c, "Failed to get user")
		return
	}

	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(userModel.Password), []byte(req.OldPassword)); err != nil {
		response.BadRequest(c, "Current password is incorrect")
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		response.InternalError(c, "Failed to process password")
		return
	}

	// Update password
	if err := database.DB.Model(&model.User{}).Where("uuid = ?", userID).Update("password", string(hashedPassword)).Error; err != nil {
		response.InternalError(c, "Failed to update password")
		return
	}

	response.Success(c, gin.H{"message": "Password updated successfully"})
}

// SearchUsers searches for users by nickname or email
func SearchUsers(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		response.BadRequest(c, "Search query is required")
		return
	}

	currentUserID, _ := c.Get("userID")

	var users []model.User
	if err := database.DB.Where("uuid != ?", currentUserID).
		Where("nickname LIKE ? OR email LIKE ?", "%"+query+"%", "%"+query+"%").
		Select("uuid", "nickname", "avatar", "signature").
		Limit(20).
		Find(&users).Error; err != nil {
		response.InternalError(c, "Failed to search users")
		return
	}

	result := make([]gin.H, 0, len(users))
	for _, u := range users {
		result = append(result, gin.H{
			"uuid":      u.UUID,
			"nickname":  u.Nickname,
			"avatar":    u.Avatar,
			"signature": u.Signature,
		})
	}

	response.Success(c, result)
}

// AdminGetUsers returns all users (admin only)
func AdminGetUsers(c *gin.Context) {
	var users []model.User
	if err := database.DB.Select("uuid", "nickname", "email", "avatar", "status", "is_admin", "created_at").
		Order("created_at DESC").
		Find(&users).Error; err != nil {
		response.InternalError(c, "Failed to get users")
		return
	}

	result := make([]gin.H, 0, len(users))
	for _, u := range users {
		result = append(result, gin.H{
			"uuid":      u.UUID,
			"nickname":  u.Nickname,
			"email":     u.Email,
			"avatar":    u.Avatar,
			"status":    u.Status,
			"isAdmin":   u.IsAdmin,
			"createdAt": u.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	response.Success(c, result)
}

// AdminUpdateUserStatus updates a user's status (admin only)
func AdminUpdateUserStatus(c *gin.Context) {
	uuid := c.Param("uuid")
	if uuid == "" {
		response.BadRequest(c, "User UUID is required")
		return
	}

	var req struct {
		Status int8 `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	// Validate status
	if req.Status != model.UserStatusActive && req.Status != model.UserStatusDisabled {
		response.BadRequest(c, "Invalid status value")
		return
	}

	// Update status
	result := database.DB.Model(&model.User{}).Where("uuid = ?", uuid).Update("status", req.Status)
	if result.Error != nil {
		response.InternalError(c, "Failed to update user status")
		return
	}
	if result.RowsAffected == 0 {
		response.NotFound(c, "User not found")
		return
	}

	response.Success(c, gin.H{"message": "User status updated"})
}
