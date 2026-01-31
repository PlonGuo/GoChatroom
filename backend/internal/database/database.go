package database

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/PlonGuo/GoChatroom/backend/internal/config"
	"github.com/PlonGuo/GoChatroom/backend/internal/model"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Init initializes the database connection
func Init() error {
	cfg := config.Get()

	var dsn string
	var isPostgres bool

	if cfg.Database.URL != "" {
		// Use full connection URL
		dsn = cfg.Database.URL
		// Detect database type from URL
		isPostgres = strings.HasPrefix(dsn, "postgres://") || strings.HasPrefix(dsn, "postgresql://")
	} else {
		// Build DSN from individual fields
		// For local dev, assume PostgreSQL if port is 5432, otherwise MySQL
		if cfg.Database.Port == "5432" {
			// PostgreSQL DSN format
			dsn = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
				cfg.Database.Host,
				cfg.Database.Port,
				cfg.Database.User,
				cfg.Database.Password,
				cfg.Database.Name,
			)
			isPostgres = true
		} else {
			// MySQL DSN format
			dsn = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
				cfg.Database.User,
				cfg.Database.Password,
				cfg.Database.Host,
				cfg.Database.Port,
				cfg.Database.Name,
			)
			isPostgres = false
		}
	}

	// Configure GORM logger
	logLevel := logger.Warn
	if cfg.IsDevelopment() {
		logLevel = logger.Info
	}

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	}

	var err error
	// Use appropriate driver based on database type
	if isPostgres {
		DB, err = gorm.Open(postgres.Open(dsn), gormConfig)
		if err != nil {
			return fmt.Errorf("failed to connect to postgres database: %w", err)
		}
		log.Println("Using PostgreSQL database")
	} else {
		DB, err = gorm.Open(mysql.Open(dsn), gormConfig)
		if err != nil {
			return fmt.Errorf("failed to connect to mysql database: %w", err)
		}
		log.Println("Using MySQL database")
	}

	// Configure connection pool
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Database connection established")
	return nil
}

// Migrate runs auto-migration for all models
func Migrate() error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}

	err := DB.AutoMigrate(
		&model.User{},
		&model.Group{},
		&model.Contact{},
		&model.ContactApply{},
		&model.Session{},
		&model.Message{},
	)
	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Database migrations completed")
	return nil
}

// Close closes the database connection
func Close() error {
	if DB == nil {
		return nil
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}

	return sqlDB.Close()
}

// GetDB returns the database instance
func GetDB() *gorm.DB {
	return DB
}
