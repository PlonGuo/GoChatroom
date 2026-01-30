package user

import (
	"errors"
	"fmt"
	"time"

	"github.com/PlonGuo/GoChatroom/backend/internal/database"
	"github.com/PlonGuo/GoChatroom/backend/internal/model"
	"github.com/PlonGuo/GoChatroom/backend/internal/service/redis"
	myjwt "github.com/PlonGuo/GoChatroom/backend/pkg/jwt"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrUserNotFound     = errors.New("user not found")
	ErrEmailExists      = errors.New("email already registered")
	ErrInvalidPassword  = errors.New("invalid password")
	ErrUserDisabled     = errors.New("user account is disabled")
)

// RegisterRequest contains registration data
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Nickname string `json:"nickname" binding:"required,min=2,max=50"`
}

// LoginRequest contains login data
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse contains user data and token after authentication
type AuthResponse struct {
	Token string      `json:"token"`
	User  UserProfile `json:"user"`
}

// UserProfile contains public user data
type UserProfile struct {
	UUID      string `json:"uuid"`
	Nickname  string `json:"nickname"`
	Email     string `json:"email"`
	Avatar    string `json:"avatar"`
	Gender    int8   `json:"gender"`
	Signature string `json:"signature"`
	Birthday  string `json:"birthday"`
	IsAdmin   bool   `json:"isAdmin"`
	CreatedAt string `json:"createdAt"`
}

// Register creates a new user account
func Register(req RegisterRequest) (*AuthResponse, error) {
	// Check if email already exists
	var existing model.User
	if err := database.DB.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		return nil, ErrEmailExists
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Generate UUID
	userUUID := "U" + uuid.New().String()[:11]

	// Create user
	user := model.User{
		UUID:     userUUID,
		Nickname: req.Nickname,
		Email:    req.Email,
		Password: string(hashedPassword),
		Avatar:   fmt.Sprintf("https://api.dicebear.com/7.x/avataaars/svg?seed=%s", userUUID),
		Status:   model.UserStatusActive,
		IsAdmin:  false,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate JWT token
	token, err := myjwt.Generate(user.UUID, user.Nickname, user.IsAdmin)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Store session in Redis
	redis.Set("session:"+token, user.UUID, 24*time.Hour)

	return &AuthResponse{
		Token: token,
		User:  toUserProfile(&user),
	}, nil
}

// Login authenticates a user and returns a token
func Login(req LoginRequest) (*AuthResponse, error) {
	var user model.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if user is disabled
	if user.Status == model.UserStatusDisabled {
		return nil, ErrUserDisabled
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, ErrInvalidPassword
	}

	// Update last online time
	database.DB.Model(&user).Update("last_online_at", time.Now())

	// Generate JWT token
	token, err := myjwt.Generate(user.UUID, user.Nickname, user.IsAdmin)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Store session in Redis
	redis.Set("session:"+token, user.UUID, 24*time.Hour)

	return &AuthResponse{
		Token: token,
		User:  toUserProfile(&user),
	}, nil
}

// Logout invalidates a user's token
func Logout(token string) error {
	return redis.Delete("session:" + token)
}

// GetByUUID retrieves a user by UUID
func GetByUUID(uuid string) (*model.User, error) {
	var user model.User
	if err := database.DB.Where("uuid = ?", uuid).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// toUserProfile converts a User model to UserProfile response
func toUserProfile(user *model.User) UserProfile {
	return UserProfile{
		UUID:      user.UUID,
		Nickname:  user.Nickname,
		Email:     user.Email,
		Avatar:    user.Avatar,
		Gender:    user.Gender,
		Signature: user.Signature,
		Birthday:  user.Birthday,
		IsAdmin:   user.IsAdmin,
		CreatedAt: user.CreatedAt.Format("2006-01-02"),
	}
}
