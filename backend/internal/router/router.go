package router

import (
	"github.com/PlonGuo/GoChatroom/backend/internal/handler"
	"github.com/PlonGuo/GoChatroom/backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

// Setup configures all routes for the application
func Setup(r *gin.Engine) {
	// Global middleware
	r.Use(middleware.CORS())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	r.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "version": "1.0.0"})
	})

	// WebSocket endpoints (uses token in query param for auth)
	r.GET("/ws", handler.WebSocketHandler)
	r.GET("/ws/rtc", handler.WebRTCSignalingHandler)

	// API v1
	v1 := r.Group("/api/v1")
	{
		// Public auth routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", handler.Register)
			auth.POST("/login", handler.Login)
		}

		// Protected routes
		protected := v1.Group("")
		protected.Use(middleware.Auth())
		{
			// Auth
			protected.POST("/auth/logout", handler.Logout)
			protected.GET("/auth/me", handler.GetCurrentUser)

			// WebRTC
			protected.GET("/webrtc/ice-servers", handler.GetICEServers)

			// User management
			users := protected.Group("/users")
			{
				users.GET("/search", handler.SearchUsers)
				users.GET("/:uuid", handler.GetUser)
				users.PUT("/profile", handler.UpdateProfile)
				users.PUT("/password", handler.UpdatePassword)
			}

			// Admin routes
			admin := protected.Group("/admin")
			admin.Use(middleware.AdminOnly())
			{
				admin.GET("/users", handler.AdminGetUsers)
				admin.PUT("/users/:uuid/status", handler.AdminUpdateUserStatus)
			}

			// Group management
			groups := protected.Group("/groups")
			{
				groups.POST("", handler.CreateGroup)
				groups.GET("/search", handler.SearchGroups)
				groups.GET("/my", handler.GetMyGroups)
				groups.GET("/:uuid", handler.GetGroup)
				groups.PUT("/:uuid", handler.UpdateGroup)
				groups.DELETE("/:uuid", handler.DissolveGroup)
				groups.GET("/:uuid/members", handler.GetGroupMembers)
				groups.POST("/:uuid/join", handler.JoinGroup)
				groups.POST("/:uuid/leave", handler.LeaveGroup)
				groups.DELETE("/:uuid/members/:memberUuid", handler.KickMember)
			}

			// Contact/Friend management
			contacts := protected.Group("/contacts")
			{
				contacts.GET("", handler.GetContacts)
				contacts.DELETE("/:uuid", handler.DeleteContact)
				contacts.POST("/:uuid/block", handler.BlockContact)
				contacts.POST("/:uuid/unblock", handler.UnblockContact)
			}

			// Friend requests
			requests := protected.Group("/requests")
			{
				requests.POST("", handler.SendFriendRequest)
				requests.GET("/pending", handler.GetPendingRequests)
				requests.GET("/sent", handler.GetSentRequests)
				requests.POST("/:uuid/accept", handler.AcceptFriendRequest)
				requests.POST("/:uuid/reject", handler.RejectFriendRequest)
			}

			// Session management
			sessions := protected.Group("/sessions")
			{
				sessions.POST("", handler.CreateSession)
				sessions.GET("", handler.GetSessions)
				sessions.GET("/:uuid", handler.GetSession)
				sessions.DELETE("/:uuid", handler.DeleteSession)
				sessions.POST("/:uuid/read", handler.ClearSessionUnread)
			}

			// Message management
			messages := protected.Group("/messages")
			{
				messages.POST("", handler.SendMessage)
				messages.GET("", handler.GetMessages)
				messages.POST("/:uuid/read", handler.MarkAsRead)
				messages.POST("/sessions/:sessionId/read-all", handler.MarkAllAsRead)
				messages.GET("/unread-count", handler.GetUnreadCount)
			}

			// Online status
			protected.GET("/online", handler.GetOnlineUsers)
			protected.GET("/online/:uuid", handler.CheckUserOnline)
		}
	}
}
