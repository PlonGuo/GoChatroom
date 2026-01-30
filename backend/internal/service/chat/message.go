package chat

// MessageType constants for WebSocket messages
const (
	MessageTypeText      = 0
	MessageTypeVoice     = 1
	MessageTypeFile      = 2
	MessageTypeImage     = 3
	MessageTypeVideoCall = 4
	MessageTypeSystem    = 99
)

// WebSocket message structure sent between client and server
type WSMessage struct {
	Type       int    `json:"type"`                 // Message type
	Content    string `json:"content,omitempty"`    // Text content
	URL        string `json:"url,omitempty"`        // File/media URL
	SendID     string `json:"sendId"`               // Sender UUID
	SendName   string `json:"sendName,omitempty"`   // Sender nickname
	SendAvatar string `json:"sendAvatar,omitempty"` // Sender avatar
	ReceiveID  string `json:"receiveId"`            // Receiver UUID (user or group)
	SessionID  string `json:"sessionId,omitempty"`  // Session UUID
	FileType   string `json:"fileType,omitempty"`   // File MIME type
	FileName   string `json:"fileName,omitempty"`   // File name
	FileSize   int64  `json:"fileSize,omitempty"`   // File size in bytes
	IsGroup    bool   `json:"isGroup,omitempty"`    // True if group message
	AVData     string `json:"avData,omitempty"`     // WebRTC signaling data
}

// WSResponse is the response sent back to clients
type WSResponse struct {
	Type      string      `json:"type"`      // "message", "system", "error"
	Data      interface{} `json:"data"`
	Timestamp int64       `json:"timestamp"`
}
