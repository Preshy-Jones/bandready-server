package writingservice

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/Preshy-Jones/bandready-server/internal/config"
	"github.com/Preshy-Jones/bandready-server/internal/models"
	usersservice "github.com/Preshy-Jones/bandready-server/internal/users/service"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EssayService struct {
	db       *gorm.DB
	cfg      *config.Config
	usersSvc *usersservice.UsersService
}

func New(db *gorm.DB, cfg *config.Config, usersSvc *usersservice.UsersService) *EssayService {
	return &EssayService{db: db, cfg: cfg, usersSvc: usersSvc}
}

type SubmitEssayInput struct {
	UserID           string
	QuestionID       string
	EssayText        string
	TimeSpentSeconds int
	SessionType      models.WritingSessionType
}

type EssayAssessmentResult struct {
	TaskResponseScore    float64
	CoherenceScore       float64
	LexicalScore         float64
	GrammarScore         float64
	OverallScore         float64
	TaskResponseFeedback string
	CoherenceFeedback    string
	LexicalFeedback      string
	GrammarFeedback      string
	OverallFeedback      string
	Annotations          interface{}
	ExaminerInsights     interface{}
	PriorityFixes        interface{}
	DetectedErrors       interface{}
	VocabularySuggestions interface{}
}

func (s *EssayService) GetQuestion(questionID string) (*models.WritingQuestion, error) {
	var q models.WritingQuestion
	return &q, s.db.First(&q, "id = ?", questionID).Error
}

func (s *EssayService) GetRandomQuestion(taskType, examType, subType string) (*models.WritingQuestion, error) {
	query := s.db.Where("task_type = ? AND is_active = true", taskType)
	if examType != "" {
		query = query.Where("exam_type = ?", examType)
	}
	if subType != "" {
		query = query.Where("sub_type = ?", subType)
	}

	var q models.WritingQuestion
	return &q, query.Order("RANDOM()").First(&q).Error
}

func (s *EssayService) GetAllQuestions(taskType, examType string) ([]models.WritingQuestion, error) {
	query := s.db.Where("task_type = ? AND is_active = true", taskType)
	if examType != "" {
		query = query.Where("exam_type = ?", examType)
	}

	var questions []models.WritingQuestion
	return questions, query.Order("created_at DESC").Find(&questions).Error
}

func (s *EssayService) SubmitEssay(input SubmitEssayInput) (*models.EssaySubmission, error) {
	// Check session access (skip for diagnostic)
	if input.SessionType != models.WritingSessionDiagnostic {
		canStart, err := s.usersSvc.CanStartSession(input.UserID, "writing")
		if err != nil {
			return nil, err
		}
		if !canStart {
			return nil, errors.New("PAYMENT_REQUIRED")
		}
	}

	wordCount := len(strings.Fields(input.EssayText))

	submission := &models.EssaySubmission{
		ID:               uuid.New().String(),
		UserID:           input.UserID,
		QuestionID:       input.QuestionID,
		EssayText:        input.EssayText,
		WordCount:        wordCount,
		TimeSpentSeconds: input.TimeSpentSeconds,
		SessionType:      input.SessionType,
		SubmittedAt:      time.Now(),
	}

	if err := s.db.Create(submission).Error; err != nil {
		return nil, err
	}

	// Deduct credits in background
	if input.SessionType != models.WritingSessionDiagnostic {
		go s.usersSvc.DeductCredits(input.UserID, "writing")
	}

	// Assess essay asynchronously
	go s.assessAndSave(submission)

	return submission, nil
}

func (s *EssayService) GetFeedback(submissionID, userID string) (*models.EssayFeedback, int, error) {
	var submission models.EssaySubmission
	if err := s.db.Where("id = ? AND user_id = ?", submissionID, userID).First(&submission).Error; err != nil {
		return nil, http.StatusNotFound, errors.New("submission not found")
	}

	var feedback models.EssayFeedback
	if err := s.db.Where("essay_id = ?", submissionID).First(&feedback).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, http.StatusAccepted, nil // Still processing
		}
		return nil, http.StatusInternalServerError, err
	}

	return &feedback, http.StatusOK, nil
}

func (s *EssayService) GetEssayHistory(userID string, limit, offset int) ([]models.EssaySubmission, int64, error) {
	var total int64
	s.db.Model(&models.EssaySubmission{}).Where("user_id = ?", userID).Count(&total)

	var submissions []models.EssaySubmission
	err := s.db.Where("user_id = ?", userID).
		Preload("Question").
		Preload("Feedback").
		Order("submitted_at DESC").
		Limit(limit).Offset(offset).
		Find(&submissions).Error

	return submissions, total, err
}

func (s *EssayService) assessAndSave(submission *models.EssaySubmission) {
	var question models.WritingQuestion
	if err := s.db.First(&question, "id = ?", submission.QuestionID).Error; err != nil {
		return
	}

	var assessment *EssayAssessmentResult
	var err error

	if s.cfg.EssayAssessmentProvider == "anthropic" {
		assessment, err = s.assessWithClaude(submission.EssayText, question.Prompt, question.TaskType)
	} else {
		assessment, err = s.assessWithOpenAI(submission.EssayText, question.Prompt, question.TaskType)
	}

	if err != nil {
		return
	}

	// Update submission scores
	s.db.Model(&models.EssaySubmission{}).Where("id = ?", submission.ID).Updates(map[string]interface{}{
		"task_response_score":     assessment.TaskResponseScore,
		"coherence_cohesion_score": assessment.CoherenceScore,
		"lexical_resource_score":  assessment.LexicalScore,
		"grammar_accuracy_score":  assessment.GrammarScore,
		"overall_band_score":      assessment.OverallScore,
	})

	// Save feedback
	feedback := models.EssayFeedback{
		ID:                     uuid.New().String(),
		EssayID:                submission.ID,
		TaskResponseFeedback:   &assessment.TaskResponseFeedback,
		CoherenceCohesionFeedback: &assessment.CoherenceFeedback,
		LexicalResourceFeedback: &assessment.LexicalFeedback,
		GrammarAccuracyFeedback: &assessment.GrammarFeedback,
		OverallFeedback:        &assessment.OverallFeedback,
		Annotations:            assessment.Annotations,
		ExaminerInsights:       assessment.ExaminerInsights,
		PriorityFixes:          assessment.PriorityFixes,
		DetectedErrors:         assessment.DetectedErrors,
		VocabularySuggestions:  assessment.VocabularySuggestions,
	}

	s.db.Create(&feedback)
}

func (s *EssayService) assessWithClaude(essayText, prompt, taskType string) (*EssayAssessmentResult, error) {
	systemPrompt := buildWritingSystemPrompt()
	userPrompt := buildWritingUserPrompt(essayText, prompt, taskType)

	reqBody := map[string]interface{}{
		"model":      "claude-haiku-4-5-20251001",
		"max_tokens": 4096,
		"messages": []map[string]string{
			{"role": "user", "content": userPrompt},
		},
		"system": systemPrompt,
	}

	data, _ := json.Marshal(reqBody)
	req, err := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("x-api-key", s.cfg.AnthropicAPIKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("anthropic request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("anthropic API error: %s", string(body))
	}

	var claudeResp struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.Unmarshal(body, &claudeResp); err != nil {
		return nil, err
	}

	if len(claudeResp.Content) == 0 {
		return nil, errors.New("empty response from Claude")
	}

	return parseAssessmentJSON(claudeResp.Content[0].Text)
}

func (s *EssayService) assessWithOpenAI(essayText, prompt, taskType string) (*EssayAssessmentResult, error) {
	userPrompt := buildWritingUserPrompt(essayText, prompt, taskType)

	reqBody := map[string]interface{}{
		"model": "gpt-4.1-mini",
		"messages": []map[string]string{
			{"role": "system", "content": buildWritingSystemPrompt()},
			{"role": "user", "content": userPrompt},
		},
		"response_format": map[string]string{"type": "json_object"},
		"temperature":     0.3,
	}

	data, _ := json.Marshal(reqBody)
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.cfg.OpenAIAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("openai request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("openai API error: %s", string(body))
	}

	var completion struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(body, &completion); err != nil {
		return nil, err
	}

	if len(completion.Choices) == 0 {
		return nil, errors.New("no completion choices")
	}

	return parseAssessmentJSON(completion.Choices[0].Message.Content)
}

func parseAssessmentJSON(raw string) (*EssayAssessmentResult, error) {
	var parsed struct {
		Scores struct {
			TaskResponse float64 `json:"taskResponse"`
			Coherence    float64 `json:"coherenceCohesion"`
			Lexical      float64 `json:"lexicalResource"`
			Grammar      float64 `json:"grammaticalRangeAccuracy"`
			Overall      float64 `json:"overall"`
		} `json:"scores"`
		Feedback struct {
			TaskResponse struct{ Justification string } `json:"taskResponse"`
			Coherence    struct{ Justification string } `json:"coherenceCohesion"`
			Lexical      struct{ Justification string } `json:"lexicalResource"`
			Grammar      struct{ Justification string } `json:"grammaticalRangeAccuracy"`
		} `json:"feedback"`
		OverallFeedback      string      `json:"overallFeedback"`
		Annotations          interface{} `json:"annotations"`
		ExaminerInsights     interface{} `json:"examinerInsights"`
		PriorityFixes        interface{} `json:"priorityFixes"`
		DetectedErrors       interface{} `json:"detectedErrors"`
		VocabularySuggestions interface{} `json:"vocabularySuggestions"`
	}

	if err := json.Unmarshal([]byte(raw), &parsed); err != nil {
		return nil, fmt.Errorf("failed to parse assessment JSON: %w", err)
	}

	return &EssayAssessmentResult{
		TaskResponseScore:    parsed.Scores.TaskResponse,
		CoherenceScore:       parsed.Scores.Coherence,
		LexicalScore:         parsed.Scores.Lexical,
		GrammarScore:         parsed.Scores.Grammar,
		OverallScore:         parsed.Scores.Overall,
		TaskResponseFeedback: parsed.Feedback.TaskResponse.Justification,
		CoherenceFeedback:    parsed.Feedback.Coherence.Justification,
		LexicalFeedback:      parsed.Feedback.Lexical.Justification,
		GrammarFeedback:      parsed.Feedback.Grammar.Justification,
		OverallFeedback:      parsed.OverallFeedback,
		Annotations:          parsed.Annotations,
		ExaminerInsights:     parsed.ExaminerInsights,
		PriorityFixes:        parsed.PriorityFixes,
		DetectedErrors:       parsed.DetectedErrors,
		VocabularySuggestions: parsed.VocabularySuggestions,
	}, nil
}

func buildWritingSystemPrompt() string {
	return `You are an expert IELTS examiner with 20+ years of experience.
Assess essays using official IELTS band descriptors. Return valid JSON only.`
}

func buildWritingUserPrompt(essay, question, taskType string) string {
	criterionName := "Task Response"
	if taskType == "TASK1" {
		criterionName = "Task Achievement"
	}

	return fmt.Sprintf(`Assess this IELTS Writing %s essay.

Question: %s

Essay: %s

Return this exact JSON structure:
{
  "scores": {
    "taskResponse": <0-9>,
    "coherenceCohesion": <0-9>,
    "lexicalResource": <0-9>,
    "grammaticalRangeAccuracy": <0-9>,
    "overall": <0-9>
  },
  "feedback": {
    "%s": {"justification": "...", "strengths": [], "weaknesses": []},
    "coherenceCohesion": {"justification": "...", "strengths": [], "weaknesses": []},
    "lexicalResource": {"justification": "...", "strengths": [], "weaknesses": []},
    "grammaticalRangeAccuracy": {"justification": "...", "strengths": [], "weaknesses": []}
  },
  "overallFeedback": "...",
  "annotations": [{"startIndex": 0, "endIndex": 10, "color": "red", "type": "grammar", "explanation": "..."}],
  "examinerInsights": [{"sentence": "...", "issue": "...", "bandImpact": "..."}],
  "priorityFixes": [{"issue": "...", "explanation": "...", "drillType": "..."}],
  "detectedErrors": [{"category": "GRAMMAR", "specificError": "...", "sentence": "...", "correction": "..."}],
  "vocabularySuggestions": [{"original": "...", "suggested": "...", "context": "..."}]
}`, taskType, question, essay, criterionName)
}

// anthropicAndOpenAIProviders - configurable via ESSAY_ASSESSMENT_PROVIDER

// writingMockFlowFixed

// 1779810933

// 17798110
