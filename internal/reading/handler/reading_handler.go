package readinghandler

import (
	"net/http"
	"strconv"

	"github.com/Preshy-Jones/bandready-server/internal/middleware"
	"github.com/Preshy-Jones/bandready-server/internal/models"
	readingservice "github.com/Preshy-Jones/bandready-server/internal/reading/service"
	"github.com/gin-gonic/gin"
)

type ReadingHandler struct {
	svc *readingservice.ReadingService
}

func New(svc *readingservice.ReadingService) *ReadingHandler {
	return &ReadingHandler{svc: svc}
}

func (h *ReadingHandler) Status(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "module": "reading"})
}

func (h *ReadingHandler) GetPassages(c *gin.Context) {
	testType := c.Query("testType")
	difficulty := c.Query("difficulty")
	topic := c.Query("topic")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	passages, total, err := h.svc.GetPassages(testType, difficulty, topic, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to get passages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"passages": passages,
		"total":    total,
	})
}

func (h *ReadingHandler) GetPassage(c *gin.Context) {
	id := c.Param("id")
	passage, err := h.svc.GetPassage(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Passage not found"})
		return
	}
	c.JSON(http.StatusOK, passage)
}

func (h *ReadingHandler) GetRecommended(c *gin.Context) {
	userID := middleware.GetUserID(c)
	passage, err := h.svc.GetRecommended(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "No passages available"})
		return
	}
	c.JSON(http.StatusOK, passage)
}

func (h *ReadingHandler) StartSession(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var body struct {
		TestType        models.ReadingTestType `json:"testType" binding:"required"`
		Mode            models.ReadingMode     `json:"mode"`
		IsTimed         bool                   `json:"isTimed"`
		PracticeFilters interface{}            `json:"practiceFilters"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	if body.Mode == "" {
		body.Mode = models.ReadingModeSinglePassage
	}

	session, err := h.svc.StartSession(userID, readingservice.StartSessionInput{
		TestType:        body.TestType,
		Mode:            body.Mode,
		IsTimed:         body.IsTimed,
		PracticeFilters: body.PracticeFilters,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to start session"})
		return
	}

	c.JSON(http.StatusCreated, session)
}

func (h *ReadingHandler) GetSession(c *gin.Context) {
	userID := middleware.GetUserID(c)
	sessionID := c.Param("sessionId")

	session, err := h.svc.GetSession(sessionID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Session not found"})
		return
	}

	c.JSON(http.StatusOK, session)
}

func (h *ReadingHandler) SubmitAnswer(c *gin.Context) {
	userID := middleware.GetUserID(c)
	sessionID := c.Param("sessionId")

	var body struct {
		QuestionID       string      `json:"questionId" binding:"required"`
		UserAnswer       interface{} `json:"userAnswer"`
		TimeSpentSeconds *int        `json:"timeSpentSeconds"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	answer, err := h.svc.SubmitAnswer(sessionID, userID, body.QuestionID, body.UserAnswer, body.TimeSpentSeconds)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, answer)
}

func (h *ReadingHandler) CompleteSession(c *gin.Context) {
	userID := middleware.GetUserID(c)
	sessionID := c.Param("sessionId")

	result, err := h.svc.CompleteSession(sessionID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *ReadingHandler) GetResults(c *gin.Context) {
	userID := middleware.GetUserID(c)
	sessionID := c.Param("sessionId")

	result, err := h.svc.GetResults(sessionID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Results not found"})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *ReadingHandler) GetProgress(c *gin.Context) {
	userID := middleware.GetUserID(c)

	progress, err := h.svc.GetProgress(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to get progress"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"progress": progress})
}

// readingProgressEndpointsAdded

// 1779810933
