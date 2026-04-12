package practiceservice

import (
	"errors"
	"fmt"
	"time"

	"github.com/Preshy-Jones/bandready-server/internal/models"
	usersservice "github.com/Preshy-Jones/bandready-server/internal/users/service"
	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PracticeService struct {
	db          *gorm.DB
	usersSvc    *usersservice.UsersService
	asynqClient *asynq.Client
}

func NewPracticeService(db *gorm.DB, usersSvc *usersservice.UsersService, asynqClient *asynq.Client) *PracticeService {
	return &PracticeService{db: db, usersSvc: usersSvc, asynqClient: asynqClient}
}

func (s *PracticeService) GetTopics(part int) ([]string, error) {
	var topics []string
	err := s.db.Model(&models.SpeakingQuestion{}).
		Where("part = ? AND is_active = true", part).
		Distinct("topic").
		Pluck("topic", &topics).Error
	return topics, err
}

func (s *PracticeService) GetRandomQuestion(part int, topic, difficulty string) (*models.SpeakingQuestion, error) {
	query := s.db.Where("part = ? AND is_active = true", part)
	if topic != "" {
		query = query.Where("topic = ?", topic)
	}
	if difficulty != "" {
		query = query.Where("difficulty_level = ?", difficulty)
	}

	var question models.SpeakingQuestion
	if err := query.Order("RANDOM()").First(&question).Error; err != nil {
		return nil, err
	}
	return &question, nil
}

func (s *PracticeService) CreateSession(userID, questionID string, part int, sessionType models.SessionType) (*models.PracticeSession, error) {
	canStart, err := s.usersSvc.CanStartSession(userID, "speaking")
	if err != nil {
		return nil, err
	}
	if !canStart && sessionType != models.SessionTypeDiagnostic {
		return nil, errors.New("PAYMENT_REQUIRED")
	}

	var session *models.PracticeSession

	err = s.db.Transaction(func(tx *gorm.DB) error {
		// Lock user row to prevent race conditions
		var user models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			First(&user, "id = ?", userID).Error; err != nil {
			return err
		}

		// Duplicate prevention: check for recent session with same question
		var recentCount int64
		tx.Model(&models.PracticeSession{}).
			Where("user_id = ? AND question_id = ? AND created_at > ?",
				userID, questionID, time.Now().Add(-60*time.Second)).
			Count(&recentCount)
		if recentCount > 0 {
			return errors.New("duplicate session detected")
		}

		// Deduct credits for non-diagnostic sessions
		if sessionType != models.SessionTypeDiagnostic {
			if user.SubscriptionTier != models.SubscriptionPremium {
				if user.CreditBalance < usersservice.SpeakingSessionCost {
					return errors.New("PAYMENT_REQUIRED")
				}
				if err := tx.Model(&user).
					UpdateColumn("credit_balance", gorm.Expr("credit_balance - ?", usersservice.SpeakingSessionCost)).
					Error; err != nil {
					return err
				}
			}
		}

		session = &models.PracticeSession{
			ID:          uuid.New().String(),
			UserID:      userID,
			QuestionID:  questionID,
			Part:        part,
			SessionType: sessionType,
		}

		return tx.Create(session).Error
	})

	return session, err
}

func (s *PracticeService) SubmitSession(sessionID, userID string, audioData []byte, prepTime, speakingTime *int) error {
	var session models.PracticeSession
	if err := s.db.Where("id = ? AND user_id = ?", sessionID, userID).First(&session).Error; err != nil {
		return fmt.Errorf("session not found: %w", err)
	}

	// Queue async job
	payload := AudioJobPayload{
		SessionID:    sessionID,
		UserID:       userID,
		AudioData:    audioData,
		PrepTime:     prepTime,
		SpeakingTime: speakingTime,
	}

	task, err := NewAudioProcessingTask(payload)
	if err != nil {
		return fmt.Errorf("failed to create task: %w", err)
	}

	_, err = s.asynqClient.Enqueue(task,
		asynq.MaxRetry(3),
		asynq.Queue("audio-processing"),
	)
	return err
}

func (s *PracticeService) GetSession(sessionID, userID string) (*models.PracticeSession, error) {
	var session models.PracticeSession
	err := s.db.Preload("Question").
		Where("id = ? AND user_id = ?", sessionID, userID).
		First(&session).Error
	return &session, err
}

func (s *PracticeService) GetUserSessions(userID string, limit, offset int, part *int) ([]models.PracticeSession, int64, error) {
	query := s.db.Where("user_id = ? AND session_type != ?", userID, models.SessionTypeDiagnostic).
		Preload("Question").
		Order("created_at DESC")

	if part != nil {
		query = query.Where("part = ?", *part)
	}

	var total int64
	query.Model(&models.PracticeSession{}).Count(&total)

	var sessions []models.PracticeSession
	err := query.Limit(limit).Offset(offset).Find(&sessions).Error
	return sessions, total, err
}

func (s *PracticeService) GetProgress(userID string) (*models.UserProgress, error) {
	var progress models.UserProgress
	err := s.db.Where("user_id = ?", userID).First(&progress).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return &models.UserProgress{UserID: userID}, nil
	}
	return &progress, err
}

func (s *PracticeService) UpdateUserProgress(userID string) error {
	// Get last 10 completed sessions (non-diagnostic)
	var sessions []models.PracticeSession
	s.db.Where("user_id = ? AND overall_band_score IS NOT NULL AND session_type != ?",
		userID, models.SessionTypeDiagnostic).
		Order("created_at DESC").
		Limit(10).
		Find(&sessions)

	if len(sessions) == 0 {
		return nil
	}

	var totalOverall, totalFluency, totalLexical, totalGrammar, totalPronunciation float64
	partTotals := map[int]float64{1: 0, 2: 0, 3: 0}
	partCounts := map[int]int{1: 0, 2: 0, 3: 0}

	for _, sess := range sessions {
		if sess.OverallBandScore != nil {
			totalOverall += *sess.OverallBandScore
		}
		if sess.FluencyCoherenceScore != nil {
			totalFluency += *sess.FluencyCoherenceScore
		}
		if sess.LexicalResourceScore != nil {
			totalLexical += *sess.LexicalResourceScore
		}
		if sess.GrammarAccuracyScore != nil {
			totalGrammar += *sess.GrammarAccuracyScore
		}
		if sess.PronunciationScore != nil {
			totalPronunciation += *sess.PronunciationScore
		}
		if sess.OverallBandScore != nil {
			partTotals[sess.Part] += *sess.OverallBandScore
			partCounts[sess.Part]++
		}
	}

	n := float64(len(sessions))
	now := time.Now()

	updates := map[string]interface{}{
		"avg_overall_score":       totalOverall / n,
		"avg_fluency_score":       totalFluency / n,
		"avg_lexical_score":       totalLexical / n,
		"avg_grammar_score":       totalGrammar / n,
		"avg_pronunciation_score": totalPronunciation / n,
		"updated_at":              now,
	}
	if partCounts[1] > 0 {
		updates["part1_avg_score"] = partTotals[1] / float64(partCounts[1])
	}
	if partCounts[2] > 0 {
		updates["part2_avg_score"] = partTotals[2] / float64(partCounts[2])
	}
	if partCounts[3] > 0 {
		updates["part3_avg_score"] = partTotals[3] / float64(partCounts[3])
	}

	// Upsert progress
	return s.db.Model(&models.UserProgress{}).
		Where("user_id = ?", userID).
		Updates(updates).Error
}

func (s *PracticeService) GetOrCreateDiagnosticSession(userID string) (*models.PracticeSession, error) {
	// Check for existing incomplete diagnostic
	var session models.PracticeSession
	err := s.db.Where("user_id = ? AND session_type = ? AND overall_band_score IS NULL",
		userID, models.SessionTypeDiagnostic).
		Order("created_at DESC").
		First(&session).Error

	if err == nil {
		return &session, nil
	}

	// Get a Part 1 question for diagnostic
	q, err := s.GetRandomQuestion(1, "", "")
	if err != nil {
		return nil, err
	}

	return s.CreateSession(userID, q.ID, 1, models.SessionTypeDiagnostic)
}

// 17798110
