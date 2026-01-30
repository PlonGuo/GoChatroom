package chat

import (
	"database/sql"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/PlonGuo/GoChatroom/backend/internal/database"
	"github.com/PlonGuo/GoChatroom/backend/internal/model"
	"github.com/PlonGuo/GoChatroom/backend/internal/service/session"
	"github.com/google/uuid"
)

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients, keyed by user UUID
	clients map[string]*Client

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Inbound messages from clients
	broadcast chan *WSMessage

	// Mutex for thread-safe access to clients map
	mu sync.RWMutex
}

var (
	hubInstance *Hub
	hubOnce     sync.Once
)

// GetHub returns the singleton Hub instance
func GetHub() *Hub {
	hubOnce.Do(func() {
		hubInstance = &Hub{
			clients:    make(map[string]*Client),
			register:   make(chan *Client, 256),
			unregister: make(chan *Client, 256),
			broadcast:  make(chan *WSMessage, 256),
		}
	})
	return hubInstance
}

// Run starts the hub's main event loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.userID] = client
			h.mu.Unlock()
			log.Printf("Client connected: %s (%s)", client.nickname, client.userID)

			// Send welcome message
			h.sendToClient(client, WSResponse{
				Type:      "system",
				Data:      map[string]string{"message": "Connected to chat server"},
				Timestamp: time.Now().Unix(),
			})

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.userID]; ok {
				delete(h.clients, client.userID)
				close(client.send)
			}
			h.mu.Unlock()
			log.Printf("Client disconnected: %s (%s)", client.nickname, client.userID)

			// Update last offline time
			database.DB.Model(&model.User{}).
				Where("uuid = ?", client.userID).
				Update("last_offline_at", sql.NullTime{Time: time.Now(), Valid: true})

		case msg := <-h.broadcast:
			h.handleMessage(msg)
		}
	}
}

// handleMessage processes an incoming message and routes it to recipients
func (h *Hub) handleMessage(msg *WSMessage) {
	// Save message to database
	dbMsg := model.Message{
		UUID:       "M" + uuid.New().String()[:11],
		SessionID:  msg.SessionID,
		Type:       int8(msg.Type),
		Content:    msg.Content,
		URL:        msg.URL,
		SendID:     msg.SendID,
		SendName:   msg.SendName,
		SendAvatar: msg.SendAvatar,
		ReceiveID:  msg.ReceiveID,
		FileType:   msg.FileType,
		FileName:   msg.FileName,
		FileSize:   msg.FileSize,
		Status:     model.MessageStatusSent,
		AVData:     msg.AVData,
		SentAt:     sql.NullTime{Time: time.Now(), Valid: true},
	}

	if err := database.DB.Create(&dbMsg).Error; err != nil {
		log.Printf("Failed to save message: %v", err)
	}

	// Update session last message
	displayContent := msg.Content
	switch msg.Type {
	case MessageTypeVoice:
		displayContent = "[Voice message]"
	case MessageTypeFile:
		displayContent = "[File: " + msg.FileName + "]"
	case MessageTypeImage:
		displayContent = "[Image]"
	case MessageTypeVideoCall:
		displayContent = "[Video call]"
	}
	if msg.SessionID != "" {
		session.UpdateLastMessage(msg.SessionID, displayContent)
	}

	// Prepare response
	response := WSResponse{
		Type: "message",
		Data: map[string]interface{}{
			"uuid":       dbMsg.UUID,
			"type":       msg.Type,
			"content":    msg.Content,
			"url":        msg.URL,
			"sendId":     msg.SendID,
			"sendName":   msg.SendName,
			"sendAvatar": msg.SendAvatar,
			"receiveId":  msg.ReceiveID,
			"sessionId":  msg.SessionID,
			"fileType":   msg.FileType,
			"fileName":   msg.FileName,
			"fileSize":   msg.FileSize,
			"avData":     msg.AVData,
			"createdAt":  dbMsg.CreatedAt.Format("2006-01-02 15:04:05"),
		},
		Timestamp: time.Now().Unix(),
	}

	if msg.IsGroup {
		// Group message: send to all group members
		h.broadcastToGroup(msg.ReceiveID, response)
	} else {
		// Direct message: send to sender and receiver
		h.sendToUser(msg.SendID, response)
		h.sendToUser(msg.ReceiveID, response)
	}
}

// sendToClient sends a response to a specific client
func (h *Hub) sendToClient(client *Client, response WSResponse) {
	data, err := json.Marshal(response)
	if err != nil {
		log.Printf("Failed to marshal response: %v", err)
		return
	}

	select {
	case client.send <- data:
	default:
		// Client buffer is full, skip message
		log.Printf("Client buffer full: %s", client.userID)
	}
}

// sendToUser sends a response to a user by their UUID
func (h *Hub) sendToUser(userID string, response WSResponse) {
	h.mu.RLock()
	client, ok := h.clients[userID]
	h.mu.RUnlock()

	if ok {
		h.sendToClient(client, response)
	}
}

// broadcastToGroup sends a message to all members of a group
func (h *Hub) broadcastToGroup(groupUUID string, response WSResponse) {
	// Get group members
	var group model.Group
	if err := database.DB.Where("uuid = ?", groupUUID).First(&group).Error; err != nil {
		log.Printf("Failed to get group: %v", err)
		return
	}

	var members []string
	if err := json.Unmarshal(group.Members, &members); err != nil {
		log.Printf("Failed to parse group members: %v", err)
		return
	}

	// Send to all online members
	h.mu.RLock()
	for _, memberID := range members {
		if client, ok := h.clients[memberID]; ok {
			h.sendToClient(client, response)
		}
	}
	h.mu.RUnlock()
}

// IsOnline checks if a user is currently connected
func (h *Hub) IsOnline(userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	_, ok := h.clients[userID]
	return ok
}

// GetOnlineUsers returns a list of online user IDs
func (h *Hub) GetOnlineUsers() []string {
	h.mu.RLock()
	defer h.mu.RUnlock()

	users := make([]string, 0, len(h.clients))
	for userID := range h.clients {
		users = append(users, userID)
	}
	return users
}
