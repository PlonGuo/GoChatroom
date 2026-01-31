package handler

import (
	"github.com/PlonGuo/GoChatroom/backend/internal/config"
	"github.com/PlonGuo/GoChatroom/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// ICEServerResponse represents the ICE server configuration
type ICEServerResponse struct {
	URLs       interface{} `json:"urls"`       // Can be string or []string
	Username   string      `json:"username,omitempty"`
	Credential string      `json:"credential,omitempty"`
}

// GetICEServers returns the ICE servers configuration for WebRTC
func GetICEServers(c *gin.Context) {
	cfg := config.Get()

	iceServers := []ICEServerResponse{
		// Always include public STUN servers
		{
			URLs: []string{
				"stun:stun.l.google.com:19302",
				"stun:stun1.l.google.com:19302",
			},
		},
	}

	// Add TURN server if configured
	if cfg.WebRTC.TURNServerURL != "" {
		iceServers = append(iceServers, ICEServerResponse{
			URLs:       cfg.WebRTC.TURNServerURL,
			Username:   cfg.WebRTC.TURNUsername,
			Credential: cfg.WebRTC.TURNPassword,
		})
	}

	response.Success(c, gin.H{
		"iceServers": iceServers,
	})
}
