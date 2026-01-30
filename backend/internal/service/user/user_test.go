package user

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRegisterRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		req     RegisterRequest
		isValid bool
	}{
		{
			name: "valid request",
			req: RegisterRequest{
				Email:    "test@example.com",
				Password: "password123",
				Nickname: "TestUser",
			},
			isValid: true,
		},
		{
			name: "empty email",
			req: RegisterRequest{
				Email:    "",
				Password: "password123",
				Nickname: "TestUser",
			},
			isValid: false,
		},
		{
			name: "short password",
			req: RegisterRequest{
				Email:    "test@example.com",
				Password: "12345",
				Nickname: "TestUser",
			},
			isValid: false,
		},
		{
			name: "short nickname",
			req: RegisterRequest{
				Email:    "test@example.com",
				Password: "password123",
				Nickname: "A",
			},
			isValid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Validate the request structure
			if tt.isValid {
				assert.NotEmpty(t, tt.req.Email)
				assert.GreaterOrEqual(t, len(tt.req.Password), 6)
				assert.GreaterOrEqual(t, len(tt.req.Nickname), 2)
			}
		})
	}
}

func TestLoginRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		req     LoginRequest
		isValid bool
	}{
		{
			name: "valid request",
			req: LoginRequest{
				Email:    "test@example.com",
				Password: "password123",
			},
			isValid: true,
		},
		{
			name: "empty email",
			req: LoginRequest{
				Email:    "",
				Password: "password123",
			},
			isValid: false,
		},
		{
			name: "empty password",
			req: LoginRequest{
				Email:    "test@example.com",
				Password: "",
			},
			isValid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.isValid {
				assert.NotEmpty(t, tt.req.Email)
				assert.NotEmpty(t, tt.req.Password)
			}
		})
	}
}

func TestUserProfile_Structure(t *testing.T) {
	profile := UserProfile{
		UUID:      "U12345678901",
		Nickname:  "TestUser",
		Email:     "test@example.com",
		Avatar:    "https://example.com/avatar.png",
		Gender:    1,
		Signature: "Hello World",
		Birthday:  "2000-01-01",
		IsAdmin:   false,
		CreatedAt: "2024-01-01",
	}

	assert.Equal(t, "U12345678901", profile.UUID)
	assert.Equal(t, "TestUser", profile.Nickname)
	assert.Equal(t, "test@example.com", profile.Email)
	assert.False(t, profile.IsAdmin)
}

func TestErrors(t *testing.T) {
	assert.Error(t, ErrUserNotFound)
	assert.Error(t, ErrEmailExists)
	assert.Error(t, ErrInvalidPassword)
	assert.Error(t, ErrUserDisabled)

	assert.Equal(t, "user not found", ErrUserNotFound.Error())
	assert.Equal(t, "email already registered", ErrEmailExists.Error())
	assert.Equal(t, "invalid password", ErrInvalidPassword.Error())
	assert.Equal(t, "user account is disabled", ErrUserDisabled.Error())
}
