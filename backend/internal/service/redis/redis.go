package redis

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/PlonGuo/GoChatroom/backend/internal/config"
	"github.com/redis/go-redis/v9"
)

var client *redis.Client
var ctx = context.Background()

// Init initializes the Redis connection
func Init() error {
	cfg := config.Get()

	var opts *redis.Options
	var err error

	if cfg.Redis.URL != "" {
		// Parse Upstash Redis URL
		opts, err = redis.ParseURL(cfg.Redis.URL)
		if err != nil {
			return fmt.Errorf("failed to parse Redis URL: %w", err)
		}
	} else {
		// Use individual fields for local Redis
		opts = &redis.Options{
			Addr:     fmt.Sprintf("%s:%s", cfg.Redis.Host, cfg.Redis.Port),
			Password: cfg.Redis.Password,
			DB:       0,
		}
	}

	client = redis.NewClient(opts)

	// Test connection
	if err := client.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	log.Println("Redis connection established")
	return nil
}

// Close closes the Redis connection
func Close() error {
	if client == nil {
		return nil
	}
	return client.Close()
}

// GetClient returns the Redis client instance
func GetClient() *redis.Client {
	return client
}

// Set stores a key-value pair with expiration
func Set(key string, value string, expiration time.Duration) error {
	return client.Set(ctx, key, value, expiration).Err()
}

// Get retrieves a value by key
func Get(key string) (string, error) {
	val, err := client.Get(ctx, key).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return "", nil
		}
		return "", err
	}
	return val, nil
}

// GetOrError retrieves a value by key, returns error if key doesn't exist
func GetOrError(key string) (string, error) {
	return client.Get(ctx, key).Result()
}

// Exists checks if a key exists
func Exists(key string) (bool, error) {
	n, err := client.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return n > 0, nil
}

// Delete removes a key
func Delete(key string) error {
	return client.Del(ctx, key).Err()
}

// DeleteIfExists removes a key if it exists
func DeleteIfExists(key string) error {
	exists, err := client.Exists(ctx, key).Result()
	if err != nil {
		return err
	}
	if exists > 0 {
		return client.Del(ctx, key).Err()
	}
	return nil
}

// DeleteByPattern removes all keys matching a pattern
func DeleteByPattern(pattern string) error {
	keys, err := client.Keys(ctx, pattern).Result()
	if err != nil {
		return err
	}
	if len(keys) == 0 {
		return nil
	}
	return client.Del(ctx, keys...).Err()
}

// SetHash stores a hash field
func SetHash(key, field, value string) error {
	return client.HSet(ctx, key, field, value).Err()
}

// GetHash retrieves a hash field
func GetHash(key, field string) (string, error) {
	val, err := client.HGet(ctx, key, field).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return "", nil
		}
		return "", err
	}
	return val, nil
}

// GetAllHash retrieves all fields from a hash
func GetAllHash(key string) (map[string]string, error) {
	return client.HGetAll(ctx, key).Result()
}

// DeleteHash removes a field from a hash
func DeleteHash(key, field string) error {
	return client.HDel(ctx, key, field).Err()
}

// Expire sets expiration on a key
func Expire(key string, expiration time.Duration) error {
	return client.Expire(ctx, key, expiration).Err()
}

// Publish publishes a message to a channel
func Publish(channel string, message interface{}) error {
	return client.Publish(ctx, channel, message).Err()
}

// Subscribe subscribes to a channel and returns a PubSub
func Subscribe(channel string) *redis.PubSub {
	return client.Subscribe(ctx, channel)
}
