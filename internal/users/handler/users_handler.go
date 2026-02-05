package usershandler

import (
	"net/http"
	"time"

	"github.com/Preshy-Jones/bandready-server/internal/middleware"
	"github.com/Preshy-Jones/bandready-server/internal/models"
	usersservice "github.com/Preshy-Jones/bandready-server/internal/users/service"
	"github.com/gin-gonic/gin"
)

type UsersHandler struct {
	svc *usersservice.UsersService
}

func New(svc *usersservice.UsersService) *UsersHandler {
	return &UsersHandler{svc: svc}
}

func (h *UsersHandler) GetProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	user, err := h.svc.FindByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func (h *UsersHandler) UpdateProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var body struct {
		FullName       *string           `json:"fullName"`
		NativeLanguage *string           `json:"nativeLanguage"`
		Country        *string           `json:"country"`
		ExamType       *models.ExamType  `json:"examType"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	user, err := h.svc.UpdateProfile(userID, usersservice.UpdateProfileInput{
		FullName:       body.FullName,
		NativeLanguage: body.NativeLanguage,
		Country:        body.Country,
		ExamType:       body.ExamType,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UsersHandler) UpdateGoals(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var body struct {
		TargetBandScore *float64   `json:"targetBandScore"`
		TargetExamDate  *time.Time `json:"targetExamDate"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	user, err := h.svc.UpdateGoals(userID, usersservice.UpdateGoalsInput{
		TargetBandScore: body.TargetBandScore,
		TargetExamDate:  body.TargetExamDate,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update goals"})
		return
	}

	c.JSON(http.StatusOK, user)
}
