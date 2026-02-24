package webrtc

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// newTestHub creates a fresh SignalingHub for testing (not the singleton)
func newTestHub() *SignalingHub {
	return &SignalingHub{
		clients:    make(map[string]*SignalingClient),
		register:   make(chan *SignalingClient, 256),
		unregister: make(chan *SignalingClient, 256),
		relay:      make(chan *SignalingMessage, 256),
	}
}

// newTestClient creates a test client with a send channel (no real WebSocket)
func newTestClient(hub *SignalingHub, userID string, bufferSize int) *SignalingClient {
	return &SignalingClient{
		hub:    hub,
		conn:   nil,
		send:   make(chan []byte, bufferSize),
		userID: userID,
	}
}

func TestRelayMessage_Success(t *testing.T) {
	hub := newTestHub()
	sender := newTestClient(hub, "alice", 256)
	target := newTestClient(hub, "bob", 256)

	hub.clients["alice"] = sender
	hub.clients["bob"] = target

	msg := &SignalingMessage{
		Type: "offer",
		From: "alice",
		To:   "bob",
	}

	hub.relayMessage(msg)

	// Target should receive the message
	assert.Len(t, target.send, 1)

	data := <-target.send
	var received SignalingMessage
	err := json.Unmarshal(data, &received)
	require.NoError(t, err)
	assert.Equal(t, "offer", received.Type)
	assert.Equal(t, "alice", received.From)
	assert.Equal(t, "bob", received.To)

	// Sender should NOT receive any error
	assert.Len(t, sender.send, 0)
}

func TestRelayMessage_TargetNotConnected(t *testing.T) {
	hub := newTestHub()
	sender := newTestClient(hub, "alice", 256)
	hub.clients["alice"] = sender

	// "bob" is NOT registered in hub.clients
	msg := &SignalingMessage{
		Type: "offer",
		From: "alice",
		To:   "bob",
	}

	hub.relayMessage(msg)

	// Sender should receive an error notification with reason "peer_not_connected"
	require.Len(t, sender.send, 1)

	data := <-sender.send
	var errMsg SignalingMessage
	err := json.Unmarshal(data, &errMsg)
	require.NoError(t, err)
	assert.Equal(t, "error", errMsg.Type)
	assert.Equal(t, "server", errMsg.From)
	assert.Equal(t, "alice", errMsg.To)

	var payload map[string]string
	err = json.Unmarshal(errMsg.Payload, &payload)
	require.NoError(t, err)
	assert.Equal(t, "peer_not_connected", payload["reason"])
}

func TestRelayMessage_BufferFull_NotifiesAndKicks(t *testing.T) {
	hub := newTestHub()
	sender := newTestClient(hub, "alice", 256)
	// Target has buffer size 0 — any send will hit the default case
	target := newTestClient(hub, "bob", 0)

	hub.clients["alice"] = sender
	hub.clients["bob"] = target

	msg := &SignalingMessage{
		Type: "offer",
		From: "alice",
		To:   "bob",
	}

	hub.relayMessage(msg)

	// 1. Sender should receive "peer_unavailable" error
	require.Len(t, sender.send, 1)

	data := <-sender.send
	var errMsg SignalingMessage
	err := json.Unmarshal(data, &errMsg)
	require.NoError(t, err)
	assert.Equal(t, "error", errMsg.Type)

	var payload map[string]string
	err = json.Unmarshal(errMsg.Payload, &payload)
	require.NoError(t, err)
	assert.Equal(t, "peer_unavailable", payload["reason"])

	// 2. Target should be removed from hub (kicked)
	hub.mu.RLock()
	_, exists := hub.clients["bob"]
	hub.mu.RUnlock()
	assert.False(t, exists, "bob should be removed from clients after buffer full")

	// 3. Target's send channel should be closed
	_, open := <-target.send
	assert.False(t, open, "bob's send channel should be closed")
}

func TestNotifySender_SenderNotConnected(t *testing.T) {
	hub := newTestHub()
	// "alice" is NOT registered — notifySender should not panic
	hub.notifySender("alice", "peer_not_connected")
	// No panic = pass
}

func TestNotifySender_SenderBufferFull(t *testing.T) {
	hub := newTestHub()
	// Sender has buffer size 0 — notification will be silently dropped
	sender := newTestClient(hub, "alice", 0)
	hub.clients["alice"] = sender

	hub.notifySender("alice", "peer_unavailable")

	// Should not panic, message silently dropped
	assert.Len(t, sender.send, 0)
}

func TestNotifySender_Success(t *testing.T) {
	hub := newTestHub()
	sender := newTestClient(hub, "alice", 256)
	hub.clients["alice"] = sender

	hub.notifySender("alice", "peer_not_connected")

	require.Len(t, sender.send, 1)

	data := <-sender.send
	var errMsg SignalingMessage
	err := json.Unmarshal(data, &errMsg)
	require.NoError(t, err)
	assert.Equal(t, "error", errMsg.Type)
	assert.Equal(t, "server", errMsg.From)
	assert.Equal(t, "alice", errMsg.To)

	var payload map[string]string
	err = json.Unmarshal(errMsg.Payload, &payload)
	require.NoError(t, err)
	assert.Equal(t, "peer_not_connected", payload["reason"])
}
