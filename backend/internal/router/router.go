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

			// User management will be added here
			// Group management will be added here
			// Contact management will be added here
			// Session/Message management will be added here
		}
	}
}
