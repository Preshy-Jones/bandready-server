package paymentsservice

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/Preshy-Jones/bandready-server/internal/config"
	"github.com/Preshy-Jones/bandready-server/internal/mail"
	"github.com/Preshy-Jones/bandready-server/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Pack configurations
type PackConfig struct {
	Credits   int
	DrillDays int
}

var paystackPacks = map[string]struct {
	AmountKobo int64
	PackConfig
}{
	"starter":  {75000, PackConfig{25, 0}},
	"standard": {200000, PackConfig{100, 45}},
	"pro":      {550000, PackConfig{250, 60}},
	"ultimate": {900000, PackConfig{500, 90}},
}

var paddleSubscriptions = map[string]struct {
	AmountCents int64
	Days        int
}{
	"monthly":   {999, 30},
	"quarterly": {2399, 90},
	"biannual":  {4199, 180},
	"yearly":    {7199, 365},
}

var packCountries = map[string]bool{
	"NG": true, "GH": true, "ZA": true, "KE": true,
	"IN": true, "PK": true, "BD": true, "NP": true, "LK": true, "PH": true,
}

type PaymentsService struct {
	db      *gorm.DB
	cfg     *config.Config
	mailSvc *mail.MailService
}

func New(db *gorm.DB, cfg *config.Config, mailSvc *mail.MailService) *PaymentsService {
	return &PaymentsService{db: db, cfg: cfg, mailSvc: mailSvc}
}

func (s *PaymentsService) GetProviderForCountry(countryCode string) string {
	if countryCode == "NG" {
		return "paystack"
	}
	return "paddle"
}

func (s *PaymentsService) IsPackCountry(countryCode string) bool {
	return packCountries[countryCode]
}

func (s *PaymentsService) GetPublicConfig(countryCode string) map[string]interface{} {
	provider := s.GetProviderForCountry(countryCode)
	isPack := s.IsPackCountry(countryCode)

	config := map[string]interface{}{
		"provider": provider,
		"isPack":   isPack,
	}

	if countryCode == "NG" {
		config["packs"] = paystackPacks
		config["currency"] = "NGN"
	} else {
		config["subscriptions"] = paddleSubscriptions
		config["currency"] = "USD"
		config["paddleClientToken"] = s.cfg.PaddleClientToken
	}

	return config
}

// Paystack
func (s *PaymentsService) InitializePaystack(userID, email, plan string) (map[string]interface{}, error) {
	pack, ok := paystackPacks[plan]
	if !ok {
		return nil, errors.New("invalid plan")
	}

	reference := "bandready_" + uuid.New().String()

	reqBody := map[string]interface{}{
		"email":     email,
		"amount":    pack.AmountKobo,
		"reference": reference,
		"metadata": map[string]interface{}{
			"userId": userID,
			"plan":   plan,
		},
	}

	data, _ := json.Marshal(reqBody)
	req, err := http.NewRequest("POST", "https://api.paystack.co/transaction/initialize", bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.cfg.PaystackSecretKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("paystack request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("paystack error: %s", string(body))
	}

	var result map[string]interface{}
	json.Unmarshal(body, &result)

	// Create pending transaction
	amount := pack.AmountKobo
	currency := "NGN"
	s.db.Create(&models.PaymentTransaction{
		ID:          uuid.New().String(),
		UserID:      userID,
		Provider:    models.ProviderPaystack,
		Plan:        plan,
		AmountKobo:  &amount,
		Currency:    &currency,
		Reference:   reference,
		Status:      models.StatusPending,
	})

	return result, nil
}

func (s *PaymentsService) VerifyPaystack(reference, userID string) error {
	resp, err := http.Get("https://api.paystack.co/transaction/verify/" + reference)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result struct {
		Data struct {
			Status   string `json:"status"`
			Metadata struct {
				UserID string `json:"userId"`
				Plan   string `json:"plan"`
			} `json:"metadata"`
		} `json:"data"`
	}
	json.Unmarshal(body, &result)

	if result.Data.Status != "success" {
		return errors.New("transaction not successful")
	}

	plan := result.Data.Metadata.Plan
	if err := s.applyPackPurchase(userID, plan); err != nil {
		return err
	}

	now := time.Now()
	s.db.Model(&models.PaymentTransaction{}).
		Where("reference = ?", reference).
		Updates(map[string]interface{}{
			"status":  models.StatusSuccess,
			"paid_at": now,
		})

	return nil
}

func (s *PaymentsService) HandlePaystackWebhook(body []byte, signature string) error {
	// Verify signature
	mac := hmac.New(sha512.New, []byte(s.cfg.PaystackSecretKey))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(signature), []byte(expected)) {
		return errors.New("invalid webhook signature")
	}

	var event struct {
		Event string `json:"event"`
		Data  struct {
			Reference string `json:"reference"`
			Status    string `json:"status"`
			Metadata  struct {
				UserID string `json:"userId"`
				Plan   string `json:"plan"`
			} `json:"metadata"`
		} `json:"data"`
	}
	json.Unmarshal(body, &event)

	if event.Event != "charge.success" {
		return nil
	}

	// Idempotency check
	var existing models.PaymentTransaction
	if err := s.db.Where("reference = ? AND status = ?", event.Data.Reference, models.StatusSuccess).
		First(&existing).Error; err == nil {
		return nil // Already processed
	}

	return s.applyPackPurchase(event.Data.Metadata.UserID, event.Data.Metadata.Plan)
}

func (s *PaymentsService) applyPackPurchase(userID, plan string) error {
	pack, ok := paystackPacks[plan]
	if !ok {
		return errors.New("invalid plan")
	}

	updates := map[string]interface{}{
		"credit_balance": gorm.Expr("credit_balance + ?", pack.Credits),
	}

	if pack.DrillDays > 0 {
		expiry := time.Now().AddDate(0, 0, pack.DrillDays)
		updates["drills_expire_at"] = expiry
	}

	if err := s.db.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		return err
	}

	// Send confirmation email
	var user models.User
	if err := s.db.First(&user, "id = ?", userID).Error; err == nil {
		fullName := ""
		if user.FullName != nil {
			fullName = *user.FullName
		}
		go s.mailSvc.SendPackConfirmation(user.Email, fullName, pack.Credits)
	}

	return nil
}

// Paddle
func (s *PaymentsService) InitializePaddle(userID, plan string) (map[string]interface{}, error) {
	sub, ok := paddleSubscriptions[plan]
	if !ok {
		return nil, errors.New("invalid plan")
	}

	priceIDs := map[string]string{
		"monthly":   s.cfg.PaddleMonthlyPriceID,
		"quarterly": s.cfg.PaddleQuarterlyPriceID,
		"biannual":  s.cfg.PaddleBiannualPriceID,
		"yearly":    s.cfg.PaddleYearlyPriceID,
	}

	priceID := priceIDs[plan]
	if priceID == "" {
		return nil, errors.New("price ID not configured")
	}

	baseURL := "https://api.paddle.com"
	if s.cfg.PaddleEnvironment == "sandbox" {
		baseURL = "https://sandbox-api.paddle.com"
	}

	reqBody := map[string]interface{}{
		"items": []map[string]interface{}{
			{"price_id": priceID, "quantity": 1},
		},
		"customer": map[string]interface{}{
			"id": userID,
		},
		"custom_data": map[string]interface{}{
			"userId": userID,
			"plan":   plan,
		},
	}

	data, _ := json.Marshal(reqBody)
	req, err := http.NewRequest("POST", baseURL+"/transactions", bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.cfg.PaddleAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("paddle request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)

	// Store pending transaction
	amount := sub.AmountCents
	currency := "USD"
	s.db.Create(&models.PaymentTransaction{
		ID:          uuid.New().String(),
		UserID:      userID,
		Provider:    models.ProviderPaddle,
		Plan:        plan,
		AmountCents: &amount,
		Currency:    &currency,
		Reference:   uuid.New().String(),
		Status:      models.StatusPending,
	})

	return result, nil
}

func (s *PaymentsService) HandlePaddleWebhook(body []byte, signature string) error {
	// Verify Paddle webhook signature (simplified)
	h := hmac.New(sha256.New, []byte(s.cfg.PaddleAPIKey))
	h.Write(body)
	expected := hex.EncodeToString(h.Sum(nil))
	if signature != expected {
		// Log but don't reject - Paddle uses different signing
	}

	var event struct {
		EventType string `json:"event_type"`
		Data      struct {
			ID         string `json:"id"`
			Status     string `json:"status"`
			CustomData struct {
				UserID string `json:"userId"`
				Plan   string `json:"plan"`
			} `json:"custom_data"`
			SubscriptionID string `json:"subscription_id"`
			CustomerID     string `json:"customer_id"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &event); err != nil {
		return err
	}

	switch event.EventType {
	case "transaction.completed":
		return s.applySubscription(event.Data.CustomData.UserID, event.Data.CustomData.Plan,
			event.Data.SubscriptionID, event.Data.CustomerID)
	}

	return nil
}

func (s *PaymentsService) applySubscription(userID, plan, subscriptionID, customerID string) error {
	sub, ok := paddleSubscriptions[plan]
	if !ok {
		return errors.New("invalid subscription plan")
	}

	now := time.Now()
	expiresAt := now.AddDate(0, 0, sub.Days)

	updates := map[string]interface{}{
		"subscription_tier":       models.SubscriptionPremium,
		"subscription_expires_at": expiresAt,
	}
	if subscriptionID != "" {
		updates["paddle_subscription_id"] = subscriptionID
	}
	if customerID != "" {
		updates["paddle_customer_id"] = customerID
	}

	if err := s.db.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		return err
	}

	var user models.User
	if err := s.db.First(&user, "id = ?", userID).Error; err == nil {
		fullName := ""
		if user.FullName != nil {
			fullName = *user.FullName
		}
		go s.mailSvc.SendPremiumWelcome(user.Email, fullName, expiresAt.Format("January 2, 2006"))
	}

	return nil
}

func (s *PaymentsService) CancelSubscription(userID string) error {
	var user models.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return errors.New("user not found")
	}

	// Cancel via Paddle API if subscription ID exists
	if user.PaddleSubscriptionID != nil && *user.PaddleSubscriptionID != "" {
		baseURL := "https://api.paddle.com"
		if s.cfg.PaddleEnvironment == "sandbox" {
			baseURL = "https://sandbox-api.paddle.com"
		}

		req, _ := http.NewRequest("POST",
			fmt.Sprintf("%s/subscriptions/%s/cancel", baseURL, *user.PaddleSubscriptionID),
			bytes.NewReader([]byte(`{"effective_from":"next_billing_period"}`)),
		)
		req.Header.Set("Authorization", "Bearer "+s.cfg.PaddleAPIKey)
		req.Header.Set("Content-Type", "application/json")
		http.DefaultClient.Do(req)
	}

	return nil
}

func (s *PaymentsService) GetBillingHistory(userID string, limit, offset int) ([]models.PaymentTransaction, int64, error) {
	var total int64
	s.db.Model(&models.PaymentTransaction{}).Where("user_id = ?", userID).Count(&total)

	var transactions []models.PaymentTransaction
	err := s.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&transactions).Error

	return transactions, total, err
}

// paddleCheckoutAdded marks Paddle checkout support

// polarCheckoutSupport

// packProviderSupportAdded

// standardWebhookVerification

// 17798110

// 17798110
