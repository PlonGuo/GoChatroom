package handler

import (
	"errors"

	"github.com/PlonGuo/GoChatroom/backend/internal/service/contact"
	"github.com/PlonGuo/GoChatroom/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// SendFriendRequest sends a friend request
func SendFriendRequest(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req contact.ApplyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	err := contact.SendFriendRequest(userID.(string), req)
	if err != nil {
		if errors.Is(err, contact.ErrCannotAddSelf) {
			response.BadRequest(c, "Cannot add yourself as contact")
			return
		}
		if errors.Is(err, contact.ErrAlreadyFriends) {
			response.BadRequest(c, "Already friends")
			return
		}
		if errors.Is(err, contact.ErrPendingRequest) {
			response.BadRequest(c, "Friend request already pending")
			return
		}
		response.InternalError(c, "Failed to send friend request")
		return
	}

	response.Created(c, gin.H{"message": "Friend request sent"})
}

// AcceptFriendRequest accepts a friend request
func AcceptFriendRequest(c *gin.Context) {
	userID, _ := c.Get("userID")
	applyUUID := c.Param("uuid")

	err := contact.AcceptFriendRequest(applyUUID, userID.(string))
	if err != nil {
		if errors.Is(err, contact.ErrRequestNotFound) {
			response.NotFound(c, "Friend request not found")
			return
		}
		response.InternalError(c, "Failed to accept friend request")
		return
	}

	response.Success(c, gin.H{"message": "Friend request accepted"})
}

// RejectFriendRequest rejects a friend request
func RejectFriendRequest(c *gin.Context) {
	userID, _ := c.Get("userID")
	applyUUID := c.Param("uuid")

	err := contact.RejectFriendRequest(applyUUID, userID.(string))
	if err != nil {
		if errors.Is(err, contact.ErrRequestNotFound) {
			response.NotFound(c, "Friend request not found")
			return
		}
		response.InternalError(c, "Failed to reject friend request")
		return
	}

	response.Success(c, gin.H{"message": "Friend request rejected"})
}

// GetPendingRequests returns pending friend requests
func GetPendingRequests(c *gin.Context) {
	userID, _ := c.Get("userID")

	result, err := contact.GetPendingRequests(userID.(string))
	if err != nil {
		response.InternalError(c, "Failed to get pending requests")
		return
	}

	response.Success(c, result)
}

// GetSentRequests returns sent friend requests
func GetSentRequests(c *gin.Context) {
	userID, _ := c.Get("userID")

	result, err := contact.GetSentRequests(userID.(string))
	if err != nil {
		response.InternalError(c, "Failed to get sent requests")
		return
	}

	response.Success(c, result)
}

// GetContacts returns all contacts
func GetContacts(c *gin.Context) {
	userID, _ := c.Get("userID")

	result, err := contact.GetContacts(userID.(string))
	if err != nil {
		response.InternalError(c, "Failed to get contacts")
		return
	}

	response.Success(c, result)
}

// DeleteContact removes a contact
func DeleteContact(c *gin.Context) {
	userID, _ := c.Get("userID")
	contactID := c.Param("uuid")

	err := contact.DeleteContact(userID.(string), contactID)
	if err != nil {
		response.InternalError(c, "Failed to delete contact")
		return
	}

	response.Success(c, gin.H{"message": "Contact deleted"})
}

// BlockContact blocks a contact
func BlockContact(c *gin.Context) {
	userID, _ := c.Get("userID")
	contactID := c.Param("uuid")

	err := contact.BlockContact(userID.(string), contactID)
	if err != nil {
		response.InternalError(c, "Failed to block contact")
		return
	}

	response.Success(c, gin.H{"message": "Contact blocked"})
}

// UnblockContact unblocks a contact
func UnblockContact(c *gin.Context) {
	userID, _ := c.Get("userID")
	contactID := c.Param("uuid")

	err := contact.UnblockContact(userID.(string), contactID)
	if err != nil {
		response.InternalError(c, "Failed to unblock contact")
		return
	}

	response.Success(c, gin.H{"message": "Contact unblocked"})
}
