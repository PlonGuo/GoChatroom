package main

import (
	"log"

	"github.com/PlonGuo/GoChatroom/backend/internal/config"
	"github.com/PlonGuo/GoChatroom/backend/internal/database"
	"github.com/PlonGuo/GoChatroom/backend/internal/router"
	"github.com/PlonGuo/GoChatroom/backend/internal/service/chat"
	"github.com/PlonGuo/GoChatroom/backend/internal/service/redis"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file (ignore error if file doesn't exist in production)
	_ = godotenv.Load()

	// Load configuration
	cfg := config.Get()

	// Set Gin mode based on environment
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize database connection
	if err := database.Init(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// Run database migrations
	if err := database.Migrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize Redis connection
	if err := redis.Init(); err != nil {
		log.Fatalf("Failed to initialize Redis: %v", err)
	}
	defer redis.Close()

	// Start WebSocket hub
	hub := chat.GetHub()
	go hub.Run()
	log.Println("WebSocket hub started")

	// Create Gin router
	r := gin.Default()

	// Setup routes
	router.Setup(r)

	// Start server
	log.Printf("Server starting on port %s", cfg.App.Port)
	if err := r.Run(":" + cfg.App.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
