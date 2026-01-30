package config

import (
	"os"
	"strconv"
	"sync"
)

var (
	cfg  *Config
	once sync.Once
)

// Config holds all application configuration
type Config struct {
	App      AppConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
	CORS     CORSConfig
	WebRTC   WebRTCConfig
}

// AppConfig contains application server settings
type AppConfig struct {
	Env  string // development, production
	Port string
}

// DatabaseConfig contains MySQL/PlanetScale settings
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	URL      string // Full connection URL (for PlanetScale)
}

// RedisConfig contains Redis/Upstash settings
type RedisConfig struct {
	Host     string
	Port     string
	Password string
	URL      string // Full connection URL (for Upstash)
}

// JWTConfig contains JWT authentication settings
type JWTConfig struct {
	Secret     string
	ExpireHour int
}

// CORSConfig contains CORS settings
type CORSConfig struct {
	Origins string // Comma-separated allowed origins
}

// WebRTCConfig contains TURN server settings
type WebRTCConfig struct {
	TURNServerURL string
	TURNUsername  string
	TURNPassword  string
}

// Get returns the singleton config instance
func Get() *Config {
	once.Do(func() {
		cfg = load()
	})
	return cfg
}

// load reads configuration from environment variables
func load() *Config {
	return &Config{
		App: AppConfig{
			Env:  getEnv("APP_ENV", "development"),
			Port: getEnv("PORT", "8080"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "3306"),
			User:     getEnv("DB_USER", "gochatroom"),
			Password: getEnv("DB_PASSWORD", "gochatroom"),
			Name:     getEnv("DB_NAME", "gochatroom"),
			URL:      getEnv("DATABASE_URL", ""),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			URL:      getEnv("REDIS_URL", ""),
		},
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "default-secret-change-in-production"),
			ExpireHour: getEnvInt("JWT_EXPIRE_HOUR", 24),
		},
		CORS: CORSConfig{
			Origins: getEnv("CORS_ORIGINS", "http://localhost:5173"),
		},
		WebRTC: WebRTCConfig{
			TURNServerURL: getEnv("TURN_SERVER_URL", ""),
			TURNUsername:  getEnv("TURN_USERNAME", ""),
			TURNPassword:  getEnv("TURN_PASSWORD", ""),
		},
	}
}

// getEnv returns environment variable value or default
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvInt returns environment variable as int or default
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if i, err := strconv.Atoi(value); err == nil {
			return i
		}
	}
	return defaultValue
}

// IsDevelopment returns true if running in development mode
func (c *Config) IsDevelopment() bool {
	return c.App.Env == "development"
}

// IsProduction returns true if running in production mode
func (c *Config) IsProduction() bool {
	return c.App.Env == "production"
}
