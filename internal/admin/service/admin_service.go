package adminservice

import (
	"fmt"
	"strings"
	"time"

	"github.com/Preshy-Jones/bandready-server/internal/mail"
	"github.com/Preshy-Jones/bandready-server/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AdminService struct {
	db      *gorm.DB
	mailSvc *mail.MailService
}

func New(db *gorm.DB, mailSvc *mail.MailService) *AdminService {
	return &AdminService{db: db, mailSvc: mailSvc}
}

func (s *AdminService) GetAnalytics() (map[string]interface{}, error) {
	var totalUsers, newUsersToday, premiumUsers int64
	s.db.Model(&models.User{}).Count(&totalUsers)
	s.db.Model(&models.User{}).Where("created_at >= ?", time.Now().Truncate(24*time.Hour)).Count(&newUsersToday)
	s.db.Model(&models.User{}).Where("subscription_tier = ?", models.SubscriptionPremium).Count(&premiumUsers)

	var totalSessions, totalEssays int64
	s.db.Model(&models.PracticeSession{}).Count(&totalSessions)
	s.db.Model(&models.EssaySubmission{}).Count(&totalEssays)

	return map[string]interface{}{
		"totalUsers":     totalUsers,
		"newUsersToday":  newUsersToday,
		"premiumUsers":   premiumUsers,
		"totalSessions":  totalSessions,
		"totalEssays":    totalEssays,
	}, nil
}

func (s *AdminService) GetUsageStats() (map[string]interface{}, error) {
	var speakingSessions, writingSessions int64
	s.db.Model(&models.PracticeSession{}).
		Where("session_type = ?", models.SessionTypePractice).Count(&speakingSessions)
	s.db.Model(&models.EssaySubmission{}).
		Where("session_type = ?", models.WritingSessionPractice).Count(&writingSessions)

	return map[string]interface{}{
		"speakingSessions": speakingSessions,
		"writingSessions":  writingSessions,
	}, nil
}

func (s *AdminService) GetUsers(search string, limit, offset int) ([]models.User, int64, error) {
	query := s.db.Model(&models.User{})
	if search != "" {
		query = query.Where("email ILIKE ? OR full_name ILIKE ?",
			"%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var users []models.User
	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&users).Error
	return users, total, err
}

func (s *AdminService) GetUserDetails(userID string) (*models.User, error) {
	var user models.User
	err := s.db.Preload("Progress").
		Preload("WritingProgress").
		First(&user, "id = ?", userID).Error
	return &user, err
}

func (s *AdminService) GrantCredits(userID string, amount int) error {
	return s.db.Model(&models.User{}).
		Where("id = ?", userID).
		UpdateColumn("credit_balance", gorm.Expr("credit_balance + ?", amount)).Error
}

func (s *AdminService) GrantPremium(userID string, days int) error {
	expiresAt := time.Now().AddDate(0, 0, days)
	return s.db.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"subscription_tier":       models.SubscriptionPremium,
		"subscription_expires_at": expiresAt,
	}).Error
}

func (s *AdminService) DeactivateUser(userID string) error {
	return s.db.Model(&models.User{}).Where("id = ?", userID).
		Update("email", gorm.Expr("email || '_deactivated_' || ?", uuid.New().String())).Error
}

func (s *AdminService) ExportUsersCSV() (string, error) {
	var users []models.User
	if err := s.db.Order("created_at DESC").Find(&users).Error; err != nil {
		return "", err
	}

	var sb strings.Builder
	sb.WriteString("id,email,fullName,subscriptionTier,creditBalance,createdAt\n")
	for _, u := range users {
		fullName := ""
		if u.FullName != nil {
			fullName = *u.FullName
		}
		sb.WriteString(fmt.Sprintf("%s,%s,%s,%s,%d,%s\n",
			u.ID, u.Email, fullName, u.SubscriptionTier, u.CreditBalance,
			u.CreatedAt.Format(time.RFC3339),
		))
	}
	return sb.String(), nil
}

func (s *AdminService) CreateSpeakingQuestion(q *models.SpeakingQuestion) error {
	q.ID = uuid.New().String()
	return s.db.Create(q).Error
}

func (s *AdminService) UpdateSpeakingQuestion(id string, updates map[string]interface{}) error {
	return s.db.Model(&models.SpeakingQuestion{}).Where("id = ?", id).Updates(updates).Error
}

func (s *AdminService) DeleteSpeakingQuestion(id string) error {
	return s.db.Model(&models.SpeakingQuestion{}).Where("id = ?", id).
		Update("is_active", false).Error
}

func (s *AdminService) CreateWritingQuestion(q *models.WritingQuestion) error {
	q.ID = uuid.New().String()
	return s.db.Create(q).Error
}

func (s *AdminService) UpdateWritingQuestion(id string, updates map[string]interface{}) error {
	return s.db.Model(&models.WritingQuestion{}).Where("id = ?", id).Updates(updates).Error
}

func (s *AdminService) GetAppSettings() ([]models.AppSetting, error) {
	var settings []models.AppSetting
	return settings, s.db.Find(&settings).Error
}

func (s *AdminService) UpdateAppSetting(key, value string) error {
	return s.db.Save(&models.AppSetting{Key: key, Value: value}).Error
}

func (s *AdminService) SendToUser(userID, subject, html string) error {
	var user models.User
	if err := s.db.First(&user, "id = ?", userID).Error; err != nil {
		return err
	}
	return s.mailSvc.SendCustom(user.Email, subject, html)
}

func (s *AdminService) BroadcastEmail(subject, html string, filter interface{}) (int, error) {
	var users []models.User
	s.db.Find(&users)

	count := 0
	for _, user := range users {
		fullName := ""
		if user.FullName != nil {
			fullName = *user.FullName
		}
		personalizedHTML := strings.ReplaceAll(html, "{{name}}", fullName)
		if err := s.mailSvc.SendCustom(user.Email, subject, personalizedHTML); err == nil {
			count++
		}
	}
	return count, nil
}

func (s *AdminService) GetPaymentAnalytics(startDate, endDate *time.Time) (map[string]interface{}, error) {
	query := s.db.Model(&models.PaymentTransaction{}).Where("status = ?", models.StatusSuccess)
	if startDate != nil {
		query = query.Where("created_at >= ?", *startDate)
	}
	if endDate != nil {
		query = query.Where("created_at <= ?", *endDate)
	}

	var transactions []models.PaymentTransaction
	query.Find(&transactions)

	totalRevenue := int64(0)
	byProvider := map[string]int64{}
	byPlan := map[string]int{}

	for _, t := range transactions {
		if t.AmountCents != nil {
			totalRevenue += *t.AmountCents
		}
		if t.AmountKobo != nil {
			totalRevenue += *t.AmountKobo / 100
		}
		byProvider[string(t.Provider)]++
		byPlan[t.Plan]++
	}

	return map[string]interface{}{
		"totalTransactions": len(transactions),
		"totalRevenue":      totalRevenue,
		"byProvider":        byProvider,
		"byPlan":            byPlan,
	}, nil
}

// 17798110

// 17798110

// 17798110

// 17798110
