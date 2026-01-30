package webrtc

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

// SignalingMessage represents a WebRTC signaling message
type SignalingMessage struct {
	Type    string          `json:"type"`
	From    string          `json:"from"`
	To      string          `json:"to"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

// SignalingClient represents a connected client for signaling
type SignalingClient struct {
	hub    *SignalingHub
	conn   *websocket.Conn
	send   chan []byte
	userID string
}

// SignalingHub maintains the set of active signaling clients
type SignalingHub struct {
	clients    map[string]*SignalingClient
	register   chan *SignalingClient
	unregister chan *SignalingClient
	relay      chan *SignalingMessage
	mu         sync.RWMutex
}

var (
	signalingHub  *SignalingHub
	signalingOnce sync.Once
)

// GetSignalingHub returns the singleton SignalingHub instance
func GetSignalingHub() *SignalingHub {
	signalingOnce.Do(func() {
		signalingHub = &SignalingHub{
			clients:    make(map[string]*SignalingClient),
			register:   make(chan *SignalingClient, 256),
			unregister: make(chan *SignalingClient, 256),
			relay:      make(chan *SignalingMessage, 256),
		}
	})
	return signalingHub
}

// Run starts the signaling hub's main event loop
func (h *SignalingHub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.userID] = client
			h.mu.Unlock()
			log.Printf("WebRTC client connected: %s", client.userID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.userID]; ok {
				delete(h.clients, client.userID)
				close(client.send)
			}
			h.mu.Unlock()
			log.Printf("WebRTC client disconnected: %s", client.userID)

		case msg := <-h.relay:
			h.relayMessage(msg)
		}
	}
}

// relayMessage sends a signaling message to the target user
func (h *SignalingHub) relayMessage(msg *SignalingMessage) {
	h.mu.RLock()
	targetClient, ok := h.clients[msg.To]
	h.mu.RUnlock()

	if !ok {
		log.Printf("Target user not connected for signaling: %s", msg.To)
		return
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Failed to marshal signaling message: %v", err)
		return
	}

	select {
	case targetClient.send <- data:
	default:
		log.Printf("Signaling client buffer full: %s", msg.To)
	}
}

// NewSignalingClient creates a new signaling client
func NewSignalingClient(hub *SignalingHub, conn *websocket.Conn, userID string) {
	client := &SignalingClient{
		hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		userID: userID,
	}

	hub.register <- client

	go client.writePump()
	go client.readPump()
}

// readPump reads messages from the WebSocket connection
func (c *SignalingClient) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebRTC signaling error: %v", err)
			}
			break
		}

		var msg SignalingMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Failed to parse signaling message: %v", err)
			continue
		}

		// Ensure the from field is set correctly
		msg.From = c.userID

		c.hub.relay <- &msg
	}
}

// writePump writes messages to the WebSocket connection
func (c *SignalingClient) writePump() {
	defer c.conn.Close()

	for message := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
			return
		}
	}
}
