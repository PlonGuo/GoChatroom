package jwt

import (
	"errors"
	"time"

	"github.com/PlonGuo/GoChatroom/backend/internal/config"
	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token has expired")
)

// Claims represents the JWT payload
type Claims struct {
	UserID   string `json:"userId"`
	Nickname string `json:"nickname"`
	IsAdmin  bool   `json:"isAdmin"`
	jwt.RegisteredClaims
}

// Generate creates a new JWT token for a user
func Generate(userID, nickname string, isAdmin bool) (string, error) {
	cfg := config.Get()

	expireTime := time.Now().Add(time.Duration(cfg.JWT.ExpireHour) * time.Hour)

	claims := Claims{
		UserID:   userID,
		Nickname: nickname,
		IsAdmin:  isAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expireTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "gochatroom",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWT.Secret))
}

// Parse validates and parses a JWT token
func Parse(tokenString string) (*Claims, error) {
	cfg := config.Get()

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.JWT.Secret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, ErrInvalidToken
}
