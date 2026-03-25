package readingservice

import (
	"errors"
	"time"

	"github.com/Preshy-Jones/bandready-server/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReadingService struct {
	db *gorm.DB
}

func New(db *gorm.DB) *ReadingService {
	return &ReadingService{db: db}
}

func (s *ReadingService) GetPassages(testType, difficulty, topic string, limit, offset int) ([]models.ReadingPassage, int64, error) {
	query := s.db.Where("is_active = true")
	if testType != "" {
		query = query.Where("test_type = ?", testType)
	}
	if difficulty != "" {
		query = query.Where("difficulty_level = ?", difficulty)
	}
	if topic != "" {
		query = query.Where("topic_category = ?", topic)
	}

	var total int64
	query.Model(&models.ReadingPassage{}).Count(&total)

	var passages []models.ReadingPassage
	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&passages).Error
	return passages, total, err
}

func (s *ReadingService) GetPassage(id string) (*models.ReadingPassage, error) {
	var passage models.ReadingPassage
	err := s.db.Preload("Questions").First(&passage, "id = ?", id).Error
	return &passage, err
}

func (s *ReadingService) GetRecommended(userID string) (*models.ReadingPassage, error) {
	// Simple recommendation: get a random passage
	var passage models.ReadingPassage
	err := s.db.Where("is_active = true").Order("RANDOM()").First(&passage).Error
	return &passage, err
}

type StartSessionInput struct {
	TestType        models.ReadingTestType
	Mode            models.ReadingMode
	IsTimed         bool
	PracticeFilters interface{}
}

func (s *ReadingService) StartSession(userID string, input StartSessionInput) (*models.ReadingSession, error) {
	session := &models.ReadingSession{
		ID:              uuid.New().String(),
		UserID:          userID,
		TestType:        input.TestType,
		Mode:            input.Mode,
		IsTimed:         input.IsTimed,
		PracticeFilters: input.PracticeFilters,
		StartedAt:       time.Now(),
	}

	return session, s.db.Create(session).Error
}

func (s *ReadingService) GetSession(sessionID, userID string) (*models.ReadingSession, error) {
	var session models.ReadingSession
	err := s.db.Preload("Answers").
		Where("id = ? AND user_id = ?", sessionID, userID).
		First(&session).Error
	return &session, err
}

func (s *ReadingService) SubmitAnswer(sessionID, userID, questionID string, answer interface{}, timeSpent *int) (*models.ReadingAnswer, error) {
	// Verify session belongs to user
	var session models.ReadingSession
	if err := s.db.Where("id = ? AND user_id = ?", sessionID, userID).First(&session).Error; err != nil {
		return nil, errors.New("session not found")
	}

	// Get correct answer
	var question models.ReadingQuestion
	if err := s.db.First(&question, "id = ?", questionID).Error; err != nil {
		return nil, errors.New("question not found")
	}

	isCorrect := checkAnswer(answer, question.CorrectAnswer)

	readingAnswer := &models.ReadingAnswer{
		ID:               uuid.New().String(),
		SessionID:        sessionID,
		QuestionID:       questionID,
		UserAnswer:       answer,
		IsCorrect:        isCorrect,
		TimeSpentSeconds: timeSpent,
		AnsweredAt:       time.Now(),
	}

	return readingAnswer, s.db.Create(readingAnswer).Error
}

func (s *ReadingService) CompleteSession(sessionID, userID string) (*models.ReadingResult, error) {
	var session models.ReadingSession
	if err := s.db.Preload("Answers").
		Where("id = ? AND user_id = ?", sessionID, userID).
		First(&session).Error; err != nil {
		return nil, errors.New("session not found")
	}

	// Calculate score
	totalQuestions := len(session.Answers)
	correct := 0
	for _, a := range session.Answers {
		if a.IsCorrect {
			correct++
		}
	}

	bandScore := calculateBandScore(correct, totalQuestions)
	now := time.Now()

	result := &models.ReadingResult{
		ID:             uuid.New().String(),
		SessionID:      sessionID,
		RawScore:       correct,
		TotalQuestions: totalQuestions,
		BandScore:      bandScore,
	}

	if err := s.db.Create(result).Error; err != nil {
		return nil, err
	}

	// Mark session complete
	s.db.Model(&session).Updates(map[string]interface{}{
		"completed_at": now,
	})

	// Update reading progress
	go s.updateProgress(userID, &session)

	return result, nil
}

func (s *ReadingService) GetResults(sessionID, userID string) (*models.ReadingResult, error) {
	var result models.ReadingResult
	err := s.db.Joins("JOIN reading_sessions ON reading_sessions.id = reading_results.session_id").
		Where("reading_results.session_id = ? AND reading_sessions.user_id = ?", sessionID, userID).
		First(&result).Error
	return &result, err
}

func (s *ReadingService) GetProgress(userID string) ([]models.ReadingProgress, error) {
	var progress []models.ReadingProgress
	err := s.db.Where("user_id = ?", userID).Find(&progress).Error
	return progress, err
}

func (s *ReadingService) updateProgress(userID string, session *models.ReadingSession) {
	for _, answer := range session.Answers {
		var question models.ReadingQuestion
		if err := s.db.First(&question, "id = ?", answer.QuestionID).Error; err != nil {
			continue
		}

		var progress models.ReadingProgress
		err := s.db.Where("user_id = ? AND question_type = ?", userID, question.QuestionType).
			First(&progress).Error

		if errors.Is(err, gorm.ErrRecordNotFound) {
			correct := 0
			if answer.IsCorrect {
				correct = 1
			}
			now := time.Now()
			s.db.Create(&models.ReadingProgress{
				ID:              uuid.New().String(),
				UserID:          userID,
				QuestionType:    question.QuestionType,
				Attempts:        1,
				Correct:         correct,
				LastPracticedAt: &now,
			})
		} else {
			correct := progress.Correct
			if answer.IsCorrect {
				correct++
			}
			now := time.Now()
			s.db.Model(&progress).Updates(map[string]interface{}{
				"attempts":          progress.Attempts + 1,
				"correct":           correct,
				"accuracy_rate":     float64(correct) / float64(progress.Attempts+1) * 100,
				"last_practiced_at": now,
			})
		}
	}
}

func checkAnswer(userAnswer, correctAnswer interface{}) bool {
	userStr, ok1 := userAnswer.(string)
	correctStr, ok2 := correctAnswer.(string)
	if ok1 && ok2 {
		return userStr == correctStr
	}
	return false
}

func calculateBandScore(correct, total int) float64 {
	if total == 0 {
		return 0
	}
	ratio := float64(correct) / float64(total)
	switch {
	case ratio >= 0.9:
		return 9.0
	case ratio >= 0.8:
		return 8.0
	case ratio >= 0.7:
		return 7.0
	case ratio >= 0.6:
		return 6.0
	case ratio >= 0.5:
		return 5.0
	case ratio >= 0.4:
		return 4.0
	default:
		return 3.0
	}
}

// readingProgressUpdated

// 1779810933
