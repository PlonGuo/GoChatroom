package handler

import (
	"strconv"

	"github.com/PlonGuo/GoChatroom/backend/internal/service/message"
	"github.com/PlonGuo/GoChatroom/backend/internal/service/user"
	"github.com/PlonGuo/GoChatroom/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// SendMessage sends a new message
func SendMessage(c *gin.Context) {
	userID, _ := c.Get("userID")
	nickname, _ := c.Get("nickname")

	var req message.CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	// Get user avatar
	avatar := ""
	if u, err := user.GetByUUID(userID.(string)); err == nil {
		avatar = u.Avatar
	}

	msg, err := message.Create(userID.(string), nickname.(string), avatar, req)
	if err != nil {
		response.InternalError(c, "Failed to send message")
		return
	}

	response.Created(c, msg)
}

// GetMessages returns messages for a session
func GetMessages(c *gin.Context) {
	sessionID := c.Query("sessionId")
	if sessionID == "" {
		response.BadRequest(c, "Session ID is required")
		return
	}

	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	messages, err := message.GetBySessionID(sessionID, limit, offset)
	if err != nil {
		response.InternalError(c, "Failed to get messages")
		return
	}

	response.Success(c, messages)
}

// MarkAsRead marks a message as read
func MarkAsRead(c *gin.Context) {
	uuid := c.Param("uuid")

	if err := message.MarkAsRead(uuid); err != nil {
		response.InternalError(c, "Failed to mark as read")
		return
	}

	response.Success(c, gin.H{"message": "Message marked as read"})
}

// MarkAllAsRead marks all messages in a session as read
func MarkAllAsRead(c *gin.Context) {
	userID, _ := c.Get("userID")
	sessionID := c.Param("sessionId")

	if err := message.MarkAllAsRead(sessionID, userID.(string)); err != nil {
		response.InternalError(c, "Failed to mark messages as read")
		return
	}

	response.Success(c, gin.H{"message": "All messages marked as read"})
}

// GetUnreadCount returns the total unread message count
func GetUnreadCount(c *gin.Context) {
	userID, _ := c.Get("userID")

	count, err := message.GetUnreadCount(userID.(string))
	if err != nil {
		response.InternalError(c, "Failed to get unread count")
		return
	}

	response.Success(c, gin.H{"count": count})
}
