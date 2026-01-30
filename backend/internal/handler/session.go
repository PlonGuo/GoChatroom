package handler

import (
	"errors"

	"github.com/PlonGuo/GoChatroom/backend/internal/service/session"
	"github.com/PlonGuo/GoChatroom/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// CreateSessionRequest contains data for creating a session
type CreateSessionRequest struct {
	ReceiveID   string `json:"receiveId" binding:"required"`
	ReceiveName string `json:"receiveName" binding:"required"`
	Avatar      string `json:"avatar"`
}

// CreateSession creates a new session or returns existing one
func CreateSession(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	avatar := req.Avatar
	if avatar == "" {
		avatar = "https://api.dicebear.com/7.x/avataaars/svg"
	}

	sess, err := session.GetOrCreate(userID.(string), req.ReceiveID, req.ReceiveName, avatar)
	if err != nil {
		response.InternalError(c, "Failed to create session")
		return
	}

	response.Success(c, gin.H{
		"uuid":        sess.UUID,
		"receiveId":   sess.ReceiveID,
		"receiveName": sess.ReceiveName,
		"avatar":      sess.Avatar,
	})
}

// GetSessions returns all sessions for the current user
func GetSessions(c *gin.Context) {
	userID, _ := c.Get("userID")

	sessions, err := session.GetUserSessions(userID.(string))
	if err != nil {
		response.InternalError(c, "Failed to get sessions")
		return
	}

	response.Success(c, sessions)
}

// GetSession returns a specific session
func GetSession(c *gin.Context) {
	uuid := c.Param("uuid")

	sess, err := session.GetByUUID(uuid)
	if err != nil {
		if errors.Is(err, session.ErrSessionNotFound) {
			response.NotFound(c, "Session not found")
			return
		}
		response.InternalError(c, "Failed to get session")
		return
	}

	response.Success(c, gin.H{
		"uuid":        sess.UUID,
		"receiveId":   sess.ReceiveID,
		"receiveName": sess.ReceiveName,
		"avatar":      sess.Avatar,
		"lastMessage": sess.LastMessage,
		"unreadCount": sess.UnreadCount,
	})
}

// DeleteSession deletes a session
func DeleteSession(c *gin.Context) {
	userID, _ := c.Get("userID")
	uuid := c.Param("uuid")

	if err := session.Delete(uuid, userID.(string)); err != nil {
		response.InternalError(c, "Failed to delete session")
		return
	}

	response.Success(c, gin.H{"message": "Session deleted"})
}

// ClearSessionUnread clears unread count for a session
func ClearSessionUnread(c *gin.Context) {
	uuid := c.Param("uuid")

	if err := session.ClearUnread(uuid); err != nil {
		response.InternalError(c, "Failed to clear unread count")
		return
	}

	response.Success(c, gin.H{"message": "Unread count cleared"})
}
