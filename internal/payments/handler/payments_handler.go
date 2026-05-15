package paymentshandler

import (
	"io"
	"net/http"
	"strconv"

	"github.com/Preshy-Jones/bandready-server/internal/middleware"
	paymentsservice "github.com/Preshy-Jones/bandready-server/internal/payments/service"
	"github.com/gin-gonic/gin"
)

type PaymentsHandler struct {
	svc *paymentsservice.PaymentsService
}

func New(svc *paymentsservice.PaymentsService) *PaymentsHandler {
	return &PaymentsHandler{svc: svc}
}

func (h *PaymentsHandler) GetConfig(c *gin.Context) {
	countryCode := c.GetHeader("x-country-code")
	if countryCode == "" {
		countryCode = c.Query("country")
	}

	config := h.svc.GetPublicConfig(countryCode)
	c.JSON(http.StatusOK, config)
}

func (h *PaymentsHandler) GetProvider(c *gin.Context) {
	countryCode := c.Query("country")
	provider := h.svc.GetProviderForCountry(countryCode)
	isPack := h.svc.IsPackCountry(countryCode)
	c.JSON(http.StatusOK, gin.H{"provider": provider, "isPack": isPack})
}

func (h *PaymentsHandler) GetBillingHistory(c *gin.Context) {
	userID := middleware.GetUserID(c)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	transactions, total, err := h.svc.GetBillingHistory(userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to get billing history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": transactions,
		"total":        total,
	})
}

func (h *PaymentsHandler) CancelSubscription(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if err := h.svc.CancelSubscription(userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Subscription cancellation requested"})
}

// Paystack
func (h *PaymentsHandler) InitializePaystack(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var body struct {
		Plan  string `json:"plan" binding:"required"`
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	result, err := h.svc.InitializePaystack(userID, body.Email, body.Plan)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *PaymentsHandler) VerifyPaystack(c *gin.Context) {
	userID := middleware.GetUserID(c)
	reference := c.Param("reference")

	if err := h.svc.VerifyPaystack(reference, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment verified successfully"})
}

func (h *PaymentsHandler) PaystackWebhook(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to read body"})
		return
	}

	signature := c.GetHeader("x-paystack-signature")
	if err := h.svc.HandlePaystackWebhook(body, signature); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OK"})
}

// Paddle
func (h *PaymentsHandler) InitializePaddle(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var body struct {
		Plan string `json:"plan" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	result, err := h.svc.InitializePaddle(userID, body.Plan)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *PaymentsHandler) PaddleWebhook(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to read body"})
		return
	}

	signature := c.GetHeader("Paddle-Signature")
	if err := h.svc.HandlePaddleWebhook(body, signature); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OK"})
}

// handlerFix

// 17798110
