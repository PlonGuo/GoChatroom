package middleware

import (
	"strings"

	myjwt "github.com/PlonGuo/GoChatroom/backend/pkg/jwt"
	"github.com/PlonGuo/GoChatroom/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// Auth middleware validates JWT tokens
func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, "No authorization header")
			c.Abort()
			return
		}

		// Extract token (Bearer <token>)
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Unauthorized(c, "Invalid authorization format")
			c.Abort()
			return
		}

		token := parts[1]
		claims, err := myjwt.Parse(token)
		if err != nil {
			if err == myjwt.ErrExpiredToken {
				response.Unauthorized(c, "Token has expired")
			} else {
				response.Unauthorized(c, "Invalid token")
			}
			c.Abort()
			return
		}

		// Set user info in context for handlers
		c.Set("userID", claims.UserID)
		c.Set("nickname", claims.Nickname)
		c.Set("isAdmin", claims.IsAdmin)

		c.Next()
	}
}

// AdminOnly middleware restricts access to admin users
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		isAdmin, exists := c.Get("isAdmin")
		if !exists || !isAdmin.(bool) {
			response.Forbidden(c, "Admin access required")
			c.Abort()
			return
		}
		c.Next()
	}
}
