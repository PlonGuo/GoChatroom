package handler

import (
	"log"
	"net/http"

	"github.com/PlonGuo/GoChatroom/backend/internal/service/chat"
	"github.com/PlonGuo/GoChatroom/backend/internal/service/user"
	myjwt "github.com/PlonGuo/GoChatroom/backend/pkg/jwt"
	"github.com/PlonGuo/GoChatroom/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins in development
		// TODO: Restrict origins in production
		return true
	},
}

// WebSocketHandler handles WebSocket connections
func WebSocketHandler(c *gin.Context) {
	// Get token from query parameter
	token := c.Query("token")
	if token == "" {
		response.Unauthorized(c, "Token is required")
		return
	}

	// Validate token
	claims, err := myjwt.Parse(token)
	if err != nil {
		response.Unauthorized(c, "Invalid token")
		return
	}

	// Get user info
	userModel, err := user.GetByUUID(claims.UserID)
	if err != nil {
		response.Unauthorized(c, "User not found")
		return
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	// Create client and start handling
	hub := chat.GetHub()
	chat.NewClient(hub, conn, claims.UserID, userModel.Nickname, userModel.Avatar)
}

// GetOnlineUsers returns the list of online users
func GetOnlineUsers(c *gin.Context) {
	hub := chat.GetHub()
	users := hub.GetOnlineUsers()
	response.Success(c, gin.H{"online": users})
}

// CheckUserOnline checks if a specific user is online
func CheckUserOnline(c *gin.Context) {
	userID := c.Param("uuid")
	hub := chat.GetHub()
	online := hub.IsOnline(userID)
	response.Success(c, gin.H{"online": online})
}
