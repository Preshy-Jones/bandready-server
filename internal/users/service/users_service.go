package usersservice

import (
	"errors"
	"time"

	"github.com/Preshy-Jones/bandready-server/internal/models"
	"gorm.io/gorm"
)

const (
	SpeakingSessionCost = 5
	WritingSessionCost  = 2
)

type UsersService struct {
	db *gorm.DB
}

func New(db *gorm.DB) *UsersService {
	return &UsersService{db: db}
}

type UpdateProfileInput struct {
	FullName       *string
	NativeLanguage *string
	Country        *string
	ExamType       *models.ExamType
}

type UpdateGoalsInput struct {
	TargetBandScore *float64
	TargetExamDate  *time.Time
}

func (s *UsersService) FindByID(id string) (*models.User, error) {
	var user models.User
	if err := s.db.First(&user, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *UsersService) FindByEmail(email string) (*models.User, error) {
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *UsersService) UpdateProfile(userID string, input UpdateProfileInput) (*models.User, error) {
	updates := map[string]interface{}{}
	if input.FullName != nil {
		updates["full_name"] = *input.FullName
	}
	if input.NativeLanguage != nil {
		updates["native_language"] = *input.NativeLanguage
	}
	if input.Country != nil {
		updates["country"] = *input.Country
	}
	if input.ExamType != nil {
		updates["exam_type"] = *input.ExamType
	}

	if err := s.db.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		return nil, err
	}

	return s.FindByID(userID)
}

func (s *UsersService) UpdateGoals(userID string, input UpdateGoalsInput) (*models.User, error) {
	updates := map[string]interface{}{}
	if input.TargetBandScore != nil {
		updates["target_band_score"] = *input.TargetBandScore
	}
	if input.TargetExamDate != nil {
		updates["target_exam_date"] = *input.TargetExamDate
	}

	if err := s.db.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		return nil, err
	}

	return s.FindByID(userID)
}

func (s *UsersService) SyncSubscriptionStatus(userID string) error {
	var user models.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return err
	}

	if user.SubscriptionTier == models.SubscriptionPremium &&
		user.SubscriptionExpiresAt != nil &&
		time.Now().After(*user.SubscriptionExpiresAt) {
		return s.db.Model(&user).Updates(map[string]interface{}{
			"subscription_tier": models.SubscriptionNone,
		}).Error
	}

	return nil
}

func (s *UsersService) CanStartSession(userID, sessionType string) (bool, error) {
	if err := s.SyncSubscriptionStatus(userID); err != nil {
		return false, err
	}

	var user models.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return false, err
	}

	if user.SubscriptionTier == models.SubscriptionPremium {
		return true, nil
	}

	cost := SpeakingSessionCost
	if sessionType == "writing" {
		cost = WritingSessionCost
	}

	return user.CreditBalance >= cost, nil
}

func (s *UsersService) DeductCredits(userID, sessionType string) error {
	cost := SpeakingSessionCost
	if sessionType == "writing" {
		cost = WritingSessionCost
	}

	result := s.db.Model(&models.User{}).
		Where("id = ? AND credit_balance >= ?", userID, cost).
		UpdateColumn("credit_balance", gorm.Expr("credit_balance - ?", cost))

	if result.RowsAffected == 0 {
		return errors.New("insufficient credit balance")
	}

	return result.Error
}

func (s *UsersService) AddCredits(userID string, amount int) error {
	return s.db.Model(&models.User{}).
		Where("id = ?", userID).
		UpdateColumn("credit_balance", gorm.Expr("credit_balance + ?", amount)).Error
}
