package handler

import (
	"errors"

	"github.com/PlonGuo/GoChatroom/backend/internal/service/group"
	"github.com/PlonGuo/GoChatroom/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

// CreateGroup creates a new group
func CreateGroup(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req group.CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	result, err := group.Create(userID.(string), req)
	if err != nil {
		response.InternalError(c, "Failed to create group")
		return
	}

	response.Created(c, result)
}

// GetGroup returns group details
func GetGroup(c *gin.Context) {
	uuid := c.Param("uuid")
	if uuid == "" {
		response.BadRequest(c, "Group UUID is required")
		return
	}

	grp, err := group.GetByUUID(uuid)
	if err != nil {
		if errors.Is(err, group.ErrGroupNotFound) || errors.Is(err, group.ErrGroupDissolved) {
			response.NotFound(c, "Group not found")
			return
		}
		response.InternalError(c, "Failed to get group")
		return
	}

	response.Success(c, gin.H{
		"uuid":      grp.UUID,
		"name":      grp.Name,
		"notice":    grp.Notice,
		"avatar":    grp.Avatar,
		"ownerId":   grp.OwnerID,
		"addMode":   grp.AddMode,
		"memberCnt": grp.MemberCnt,
	})
}

// UpdateGroup updates group info (owner only)
func UpdateGroup(c *gin.Context) {
	userID, _ := c.Get("userID")
	uuid := c.Param("uuid")

	var req group.UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	result, err := group.Update(uuid, userID.(string), req)
	if err != nil {
		if errors.Is(err, group.ErrGroupNotFound) {
			response.NotFound(c, "Group not found")
			return
		}
		if errors.Is(err, group.ErrNotGroupOwner) {
			response.Forbidden(c, "Only group owner can update group info")
			return
		}
		response.InternalError(c, "Failed to update group")
		return
	}

	response.Success(c, result)
}

// DissolveGroup dissolves a group (owner only)
func DissolveGroup(c *gin.Context) {
	userID, _ := c.Get("userID")
	uuid := c.Param("uuid")

	err := group.Dissolve(uuid, userID.(string))
	if err != nil {
		if errors.Is(err, group.ErrGroupNotFound) {
			response.NotFound(c, "Group not found")
			return
		}
		if errors.Is(err, group.ErrNotGroupOwner) {
			response.Forbidden(c, "Only group owner can dissolve group")
			return
		}
		response.InternalError(c, "Failed to dissolve group")
		return
	}

	response.Success(c, gin.H{"message": "Group dissolved"})
}

// GetGroupMembers returns all members of a group
func GetGroupMembers(c *gin.Context) {
	uuid := c.Param("uuid")

	members, err := group.GetMembers(uuid)
	if err != nil {
		if errors.Is(err, group.ErrGroupNotFound) {
			response.NotFound(c, "Group not found")
			return
		}
		response.InternalError(c, "Failed to get members")
		return
	}

	response.Success(c, members)
}

// JoinGroup adds current user to a group
func JoinGroup(c *gin.Context) {
	userID, _ := c.Get("userID")
	uuid := c.Param("uuid")

	err := group.AddMember(uuid, userID.(string))
	if err != nil {
		if errors.Is(err, group.ErrGroupNotFound) {
			response.NotFound(c, "Group not found")
			return
		}
		if errors.Is(err, group.ErrAlreadyInGroup) {
			response.BadRequest(c, "Already a member of this group")
			return
		}
		response.InternalError(c, "Failed to join group")
		return
	}

	response.Success(c, gin.H{"message": "Joined group successfully"})
}

// LeaveGroup removes current user from a group
func LeaveGroup(c *gin.Context) {
	userID, _ := c.Get("userID")
	uuid := c.Param("uuid")

	err := group.RemoveMember(uuid, userID.(string), userID.(string))
	if err != nil {
		if errors.Is(err, group.ErrGroupNotFound) {
			response.NotFound(c, "Group not found")
			return
		}
		if errors.Is(err, group.ErrNotInGroup) {
			response.BadRequest(c, "Not a member of this group")
			return
		}
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "Left group successfully"})
}

// KickMember removes a user from a group (owner only)
func KickMember(c *gin.Context) {
	userID, _ := c.Get("userID")
	groupUUID := c.Param("uuid")
	memberUUID := c.Param("memberUuid")

	err := group.RemoveMember(groupUUID, memberUUID, userID.(string))
	if err != nil {
		if errors.Is(err, group.ErrGroupNotFound) {
			response.NotFound(c, "Group not found")
			return
		}
		if errors.Is(err, group.ErrNotGroupOwner) {
			response.Forbidden(c, "Only group owner can kick members")
			return
		}
		if errors.Is(err, group.ErrNotInGroup) {
			response.BadRequest(c, "User is not a member of this group")
			return
		}
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{"message": "Member removed"})
}

// SearchGroups searches for groups by name
func SearchGroups(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		response.BadRequest(c, "Search query is required")
		return
	}

	result, err := group.Search(query)
	if err != nil {
		response.InternalError(c, "Failed to search groups")
		return
	}

	response.Success(c, result)
}

// GetMyGroups returns all groups the current user is a member of
func GetMyGroups(c *gin.Context) {
	userID, _ := c.Get("userID")

	result, err := group.GetUserGroups(userID.(string))
	if err != nil {
		response.InternalError(c, "Failed to get groups")
		return
	}

	response.Success(c, result)
}
