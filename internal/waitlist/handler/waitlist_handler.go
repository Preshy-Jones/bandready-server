package waitlisthandler

import (
	"net/http"

	"github.com/Preshy-Jones/bandready-server/internal/models"
	"github.com/google/uuid"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WaitlistHandler struct {
	db *gorm.DB
}

func New(db *gorm.DB) *WaitlistHandler {
	return &WaitlistHandler{db: db}
}

func (h *WaitlistHandler) Subscribe(c *gin.Context) {
	var body struct {
		Email    string  `json:"email" binding:"required,email"`
		FullName *string `json:"fullName"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	entry := models.Waitlist{
		ID:       uuid.New().String(),
		Email:    body.Email,
		FullName: body.FullName,
	}

	if err := h.db.Create(&entry).Error; err != nil {
		// Duplicate email is ok
		c.JSON(http.StatusOK, gin.H{"message": "You're on the waitlist!"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Successfully joined the waitlist!"})
}
