package adminhandler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/Preshy-Jones/bandready-server/internal/middleware"
	"github.com/Preshy-Jones/bandready-server/internal/models"
	adminservice "github.com/Preshy-Jones/bandready-server/internal/admin/service"
	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	svc *adminservice.AdminService
}

func New(svc *adminservice.AdminService) *AdminHandler {
	return &AdminHandler{svc: svc}
}

// Analytics
func (h *AdminHandler) GetAnalytics(c *gin.Context) {
	analytics, err := h.svc.GetAnalytics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to get analytics"})
		return
	}
	c.JSON(http.StatusOK, analytics)
}

func (h *AdminHandler) GetUsageStats(c *gin.Context) {
	stats, err := h.svc.GetUsageStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to get usage stats"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

// Users
func (h *AdminHandler) GetUsers(c *gin.Context) {
	search := c.Query("search")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	users, total, err := h.svc.GetUsers(search, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to get users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users, "total": total})
}

func (h *AdminHandler) GetUser(c *gin.Context) {
	userID := c.Param("userId")
	user, err := h.svc.GetUserDetails(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *AdminHandler) GrantCredits(c *gin.Context) {
	userID := c.Param("userId")

	var body struct {
		Amount int    `json:"amount" binding:"required,min=1"`
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	if err := h.svc.GrantCredits(userID, body.Amount); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Credits granted"})
}

func (h *AdminHandler) GrantPremium(c *gin.Context) {
	userID := c.Param("userId")

	var body struct {
		DaysValid int `json:"daysValid" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	if err := h.svc.GrantPremium(userID, body.DaysValid); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Premium granted"})
}

func (h *AdminHandler) ExportUsers(c *gin.Context) {
	csv, err := h.svc.ExportUsersCSV()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to export users"})
		return
	}

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=users.csv")
	c.String(http.StatusOK, csv)
}

// Content: Speaking Questions
func (h *AdminHandler) CreateSpeakingQuestion(c *gin.Context) {
	var q models.SpeakingQuestion
	if err := c.ShouldBindJSON(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	if err := h.svc.CreateSpeakingQuestion(&q); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create question"})
		return
	}
	c.JSON(http.StatusCreated, q)
}

func (h *AdminHandler) UpdateSpeakingQuestion(c *gin.Context) {
	id := c.Param("id")
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	if err := h.svc.UpdateSpeakingQuestion(id, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update question"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Updated"})
}

func (h *AdminHandler) DeleteSpeakingQuestion(c *gin.Context) {
	id := c.Param("id")
	if err := h.svc.DeleteSpeakingQuestion(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to delete question"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

// Content: Writing Questions
func (h *AdminHandler) CreateWritingQuestion(c *gin.Context) {
	var q models.WritingQuestion
	if err := c.ShouldBindJSON(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	if err := h.svc.CreateWritingQuestion(&q); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create question"})
		return
	}
	c.JSON(http.StatusCreated, q)
}

func (h *AdminHandler) UpdateWritingQuestion(c *gin.Context) {
	id := c.Param("id")
	var updates map[string]interface{}
	c.ShouldBindJSON(&updates)
	if err := h.svc.UpdateWritingQuestion(id, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Updated"})
}

// Mail
func (h *AdminHandler) SendToUser(c *gin.Context) {
	_ = middleware.GetUserID(c)

	var body struct {
		UserID  string `json:"userId" binding:"required"`
		Subject string `json:"subject" binding:"required"`
		HTML    string `json:"html" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	if err := h.svc.SendToUser(body.UserID, body.Subject, body.HTML); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to send email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Email sent"})
}

func (h *AdminHandler) BroadcastEmail(c *gin.Context) {
	var body struct {
		Subject  string      `json:"subject" binding:"required"`
		HTML     string      `json:"html" binding:"required"`
		Filter   interface{} `json:"filter"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	count, err := h.svc.BroadcastEmail(body.Subject, body.HTML, body.Filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to send emails"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Emails sent", "count": count})
}

// Payment settings
func (h *AdminHandler) GetPaymentSettings(c *gin.Context) {
	settings, err := h.svc.GetAppSettings()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to get settings"})
		return
	}
	c.JSON(http.StatusOK, settings)
}

func (h *AdminHandler) UpdatePaymentSetting(c *gin.Context) {
	key := c.Param("key")
	var body struct {
		Value string `json:"value" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	if err := h.svc.UpdateAppSetting(key, body.Value); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update setting"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Setting updated"})
}

// Subscriptions
func (h *AdminHandler) DeactivateUser(c *gin.Context) {
	userID := c.Param("userId")
	if err := h.svc.DeactivateUser(userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User deactivated"})
}

// Placeholder for payment analytics
func (h *AdminHandler) GetPaymentAnalytics(c *gin.Context) {
	var startDate, endDate *time.Time
	if s := c.Query("startDate"); s != "" {
		t, _ := time.Parse(time.RFC3339, s)
		startDate = &t
	}
	if e := c.Query("endDate"); e != "" {
		t, _ := time.Parse(time.RFC3339, e)
		endDate = &t
	}

	analytics, err := h.svc.GetPaymentAnalytics(startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to get analytics"})
		return
	}

	c.JSON(http.StatusOK, analytics)
}

// 17798110

// 17798110

// 17798110

// 17798110
