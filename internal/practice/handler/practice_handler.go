package practicehandler

import (
	"io"
	"net/http"
	"strconv"

	"github.com/Preshy-Jones/bandready-server/internal/middleware"
	"github.com/Preshy-Jones/bandready-server/internal/models"
	practiceservice "github.com/Preshy-Jones/bandready-server/internal/practice/service"
	"github.com/gin-gonic/gin"
)

type PracticeHandler struct {
	svc *practiceservice.PracticeService
}

func New(svc *practiceservice.PracticeService) *PracticeHandler {
	return &PracticeHandler{svc: svc}
}

func (h *PracticeHandler) GetTopics(c *gin.Context) {
	part, err := strconv.Atoi(c.Param("part"))
	if err != nil || part < 1 || part > 3 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid part"})
		return
	}

	topics, err := h.svc.GetTopics(part)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to get topics"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"topics": topics})
}

func (h *PracticeHandler) GetRandomQuestion(c *gin.Context) {
	part, err := strconv.Atoi(c.Param("part"))
	if err != nil || part < 1 || part > 3 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid part"})
		return
	}

	topic := c.Query("topic")
	difficulty := c.Query("difficulty")

	question, err := h.svc.GetRandomQuestion(part, topic, difficulty)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "No questions found"})
		return
	}

	c.JSON(http.StatusOK, question)
}

func (h *PracticeHandler) StartSession(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var body struct {
		QuestionID  string                `json:"questionId" binding:"required"`
		Part        int                   `json:"part" binding:"required,min=1,max=3"`
		SessionType models.SessionType    `json:"sessionType"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	sessionType := body.SessionType
	if sessionType == "" {
		sessionType = models.SessionTypePractice
	}

	session, err := h.svc.CreateSession(userID, body.QuestionID, body.Part, sessionType)
	if err != nil {
		if err.Error() == "PAYMENT_REQUIRED" {
			c.JSON(http.StatusPaymentRequired, gin.H{"message": "Insufficient credits or no active subscription"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, session)
}

func (h *PracticeHandler) SubmitSession(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Multipart form: sessionId + audio file
	sessionID := c.PostForm("sessionId")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "sessionId is required"})
		return
	}

	file, _, err := c.Request.FormFile("audio")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "audio file is required"})
		return
	}
	defer file.Close()

	audioData, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to read audio"})
		return
	}

	var prepTime, speakingTime *int
	if pt := c.PostForm("prepTimeUsedSeconds"); pt != "" {
		v, _ := strconv.Atoi(pt)
		prepTime = &v
	}
	if st := c.PostForm("speakingTimeSeconds"); st != "" {
		v, _ := strconv.Atoi(st)
		speakingTime = &v
	}

	if err := h.svc.SubmitSession(sessionID, userID, audioData, prepTime, speakingTime); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to submit session"})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"message": "Session submitted for processing", "sessionId": sessionID})
}

func (h *PracticeHandler) GetSession(c *gin.Context) {
	userID := middleware.GetUserID(c)
	sessionID := c.Param("sessionId")

	session, err := h.svc.GetSession(sessionID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Session not found"})
		return
	}

	c.JSON(http.StatusOK, session)
}

func (h *PracticeHandler) GetSessions(c *gin.Context) {
	userID := middleware.GetUserID(c)

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	var part *int
	if p := c.Query("part"); p != "" {
		v, err := strconv.Atoi(p)
		if err == nil {
			part = &v
		}
	}

	sessions, total, err := h.svc.GetUserSessions(userID, limit, offset, part)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to get sessions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sessions": sessions,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

func (h *PracticeHandler) GetProgress(c *gin.Context) {
	userID := middleware.GetUserID(c)

	progress, err := h.svc.GetProgress(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to get progress"})
		return
	}

	c.JSON(http.StatusOK, progress)
}

func (h *PracticeHandler) StartDiagnostic(c *gin.Context) {
	userID := middleware.GetUserID(c)

	session, err := h.svc.GetOrCreateDiagnosticSession(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to start diagnostic"})
		return
	}

	c.JSON(http.StatusOK, session)
}

// 17798110
