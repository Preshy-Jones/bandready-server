package writinghandler

import (
	"net/http"
	"strconv"

	"github.com/Preshy-Jones/bandready-server/internal/middleware"
	"github.com/Preshy-Jones/bandready-server/internal/models"
	writingservice "github.com/Preshy-Jones/bandready-server/internal/writing/service"
	"github.com/gin-gonic/gin"
)

type EssayHandler struct {
	svc *writingservice.EssayService
}

func New(svc *writingservice.EssayService) *EssayHandler {
	return &EssayHandler{svc: svc}
}

func (h *EssayHandler) GetQuestion(c *gin.Context) {
	questionID := c.Param("questionId")
	q, err := h.svc.GetQuestion(questionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Question not found"})
		return
	}
	c.JSON(http.StatusOK, q)
}

func (h *EssayHandler) GetRandomQuestion(c *gin.Context) {
	taskType := c.Param("taskType")
	examType := c.Query("examType")
	subType := c.Query("subType")

	q, err := h.svc.GetRandomQuestion(taskType, examType, subType)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "No questions found"})
		return
	}
	c.JSON(http.StatusOK, q)
}

func (h *EssayHandler) GetAllQuestions(c *gin.Context) {
	taskType := c.Param("taskType")
	examType := c.Query("examType")

	questions, err := h.svc.GetAllQuestions(taskType, examType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to get questions"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"questions": questions})
}

func (h *EssayHandler) SubmitEssay(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var body struct {
		QuestionID       string                     `json:"questionId" binding:"required"`
		EssayText        string                     `json:"essayText" binding:"required"`
		TimeSpentSeconds int                        `json:"timeSpentSeconds"`
		SessionType      models.WritingSessionType  `json:"sessionType"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	sessionType := body.SessionType
	if sessionType == "" {
		sessionType = models.WritingSessionPractice
	}

	submission, err := h.svc.SubmitEssay(writingservice.SubmitEssayInput{
		UserID:           userID,
		QuestionID:       body.QuestionID,
		EssayText:        body.EssayText,
		TimeSpentSeconds: body.TimeSpentSeconds,
		SessionType:      sessionType,
	})
	if err != nil {
		if err.Error() == "PAYMENT_REQUIRED" {
			c.JSON(http.StatusPaymentRequired, gin.H{"message": "Insufficient credits or no active subscription"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, submission)
}

func (h *EssayHandler) GetFeedback(c *gin.Context) {
	userID := middleware.GetUserID(c)
	submissionID := c.Param("submissionId")

	feedback, statusCode, err := h.svc.GetFeedback(submissionID, userID)
	if err != nil {
		c.JSON(statusCode, gin.H{"message": err.Error()})
		return
	}

	if statusCode == http.StatusAccepted {
		c.JSON(http.StatusAccepted, gin.H{"message": "Assessment in progress"})
		return
	}

	c.JSON(http.StatusOK, feedback)
}

func (h *EssayHandler) GetEssayHistory(c *gin.Context) {
	userID := middleware.GetUserID(c)

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	submissions, total, err := h.svc.GetEssayHistory(userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to get essays"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"essays": submissions,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// getAllQuestionsAdded for categories view
