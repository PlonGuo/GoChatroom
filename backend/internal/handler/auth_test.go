package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// setupRouter creates a test router with the given handler
func setupRouter(method, path string, handler gin.HandlerFunc) *gin.Engine {
	r := gin.New()
	switch method {
	case "POST":
		r.POST(path, handler)
	case "GET":
		r.GET(path, handler)
	}
	return r
}

func TestRegister_InvalidJSON(t *testing.T) {
	router := setupRouter("POST", "/register", Register)

	req := httptest.NewRequest("POST", "/register", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, float64(-1), response["code"])
}

func TestRegister_MissingFields(t *testing.T) {
	router := setupRouter("POST", "/register", Register)

	// Missing email
	body := map[string]string{
		"password": "password123",
		"nickname": "TestUser",
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, float64(-1), response["code"])
}

func TestRegister_InvalidEmail(t *testing.T) {
	router := setupRouter("POST", "/register", Register)

	body := map[string]string{
		"email":    "not-an-email",
		"password": "password123",
		"nickname": "TestUser",
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestRegister_ShortPassword(t *testing.T) {
	router := setupRouter("POST", "/register", Register)

	body := map[string]string{
		"email":    "test@example.com",
		"password": "12345", // Less than 6 characters
		"nickname": "TestUser",
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestLogin_InvalidJSON(t *testing.T) {
	router := setupRouter("POST", "/login", Login)

	req := httptest.NewRequest("POST", "/login", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestLogin_MissingFields(t *testing.T) {
	router := setupRouter("POST", "/login", Login)

	// Missing password
	body := map[string]string{
		"email": "test@example.com",
	}
	jsonBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/login", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestLogout_NoToken(t *testing.T) {
	router := setupRouter("POST", "/logout", Logout)

	req := httptest.NewRequest("POST", "/logout", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "No token provided", response["message"])
}

func TestLogout_InvalidAuthFormat(t *testing.T) {
	router := setupRouter("POST", "/logout", Logout)

	req := httptest.NewRequest("POST", "/logout", nil)
	req.Header.Set("Authorization", "InvalidFormat token123")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Invalid authorization format", response["message"])
}

func TestGetCurrentUser_NotAuthenticated(t *testing.T) {
	router := setupRouter("GET", "/me", GetCurrentUser)

	req := httptest.NewRequest("GET", "/me", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Not authenticated", response["message"])
}
