package handler

import (
	"errors"
	"strings"

	"github.com/PlonGuo/GoChatroom/backend/internal/service/user"
	"github.com/PlonGuo/GoChatroom/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// Register handles user registration
func Register(c *gin.Context) {
	var req user.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	result, err := user.Register(req)
	if err != nil {
		if errors.Is(err, user.ErrEmailExists) {
			response.BadRequest(c, "Email already registered")
			return
		}
		response.InternalError(c, "Registration failed")
		return
	}

	response.Created(c, result)
}

// Login handles user login
func Login(c *gin.Context) {
	var req user.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	result, err := user.Login(req)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			response.Unauthorized(c, "User not found")
			return
		}
		if errors.Is(err, user.ErrInvalidPassword) {
			response.Unauthorized(c, "Invalid password")
			return
		}
		if errors.Is(err, user.ErrUserDisabled) {
			response.Forbidden(c, "Account is disabled")
			return
		}
		response.InternalError(c, "Login failed")
		return
	}

	response.Success(c, result)
}

// Logout handles user logout
func Logout(c *gin.Context) {
	// Get token from Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		response.Unauthorized(c, "No token provided")
		return
	}

	// Extract token (Bearer <token>)
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		response.Unauthorized(c, "Invalid authorization format")
		return
	}

	token := parts[1]
	if err := user.Logout(token); err != nil {
		response.InternalError(c, "Logout failed")
		return
	}

	response.Success(c, gin.H{"message": "Logged out successfully"})
}

// GetCurrentUser returns the current authenticated user's profile
func GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		response.Unauthorized(c, "Not authenticated")
		return
	}

	userModel, err := user.GetByUUID(userID.(string))
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
		"email":     userModel.Email,
		"avatar":    userModel.Avatar,
		"gender":    userModel.Gender,
		"signature": userModel.Signature,
		"birthday":  userModel.Birthday,
		"isAdmin":   userModel.IsAdmin,
		"createdAt": userModel.CreatedAt.Format("2006-01-02"),
	}

	response.Success(c, profile)
}
