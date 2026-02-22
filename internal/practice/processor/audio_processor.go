package processor

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/Preshy-Jones/bandready-server/internal/mail"
	"github.com/Preshy-Jones/bandready-server/internal/models"
	practiceservice "github.com/Preshy-Jones/bandready-server/internal/practice/service"
	"github.com/hibiken/asynq"
	"gorm.io/gorm"
)

const TypeAudioProcessing = "audio:process"

type AudioJobPayload struct {
	SessionID    string  `json:"sessionId"`
	UserID       string  `json:"userId"`
	AudioData    []byte  `json:"audioData"`
	PrepTime     *int    `json:"prepTime,omitempty"`
	SpeakingTime *int    `json:"speakingTime,omitempty"`
}

func NewAudioProcessingTask(payload practiceservice.AudioJobPayload) (*asynq.Task, error) {
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TypeAudioProcessing, data), nil
}

type AudioProcessor struct {
	db          *gorm.DB
	speechSvc   *practiceservice.SpeechService
	s3Svc       *practiceservice.S3Service
	practiceSvc *practiceservice.PracticeService
	mailSvc     *mail.MailService
}

func New(
	db *gorm.DB,
	speechSvc *practiceservice.SpeechService,
	s3Svc *practiceservice.S3Service,
	practiceSvc *practiceservice.PracticeService,
	mailSvc *mail.MailService,
) *AudioProcessor {
	return &AudioProcessor{
		db:          db,
		speechSvc:   speechSvc,
		s3Svc:       s3Svc,
		practiceSvc: practiceSvc,
		mailSvc:     mailSvc,
	}
}

func (p *AudioProcessor) ProcessTask(ctx context.Context, t *asynq.Task) error {
	var payload AudioJobPayload
	if err := json.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("failed to unmarshal payload: %w", err)
	}

	log.Printf("Processing audio for session %s", payload.SessionID)

	// Fetch session with question
	var session models.PracticeSession
	if err := p.db.Preload("Question").Preload("User").
		First(&session, "id = ?", payload.SessionID).Error; err != nil {
		return fmt.Errorf("session not found: %w", err)
	}

	// Upload audio and transcribe in parallel
	type uploadResult struct {
		key string
		err error
	}
	type transcriptResult struct {
		result *practiceservice.TranscriptResult
		err    error
	}

	uploadCh := make(chan uploadResult, 1)
	transcriptCh := make(chan transcriptResult, 1)

	go func() {
		key, err := p.s3Svc.UploadAudio(payload.AudioData, payload.UserID, payload.SessionID)
		uploadCh <- uploadResult{key, err}
	}()

	go func() {
		result, err := p.speechSvc.Transcribe(payload.AudioData, payload.SessionID+".webm")
		transcriptCh <- transcriptResult{result, err}
	}()

	uploadRes := <-uploadCh
	transcriptRes := <-transcriptCh

	if uploadRes.err != nil {
		return fmt.Errorf("s3 upload failed: %w", uploadRes.err)
	}
	if transcriptRes.err != nil {
		return fmt.Errorf("transcription failed: %w", transcriptRes.err)
	}

	// Calculate audio metrics
	metrics := p.speechSvc.CalculateMetrics(transcriptRes.result.Text)

	// Adjust WPM with actual speaking time
	if payload.SpeakingTime != nil && *payload.SpeakingTime > 0 {
		metrics.WordsPerMinute = int(float64(metrics.TotalWords) / (float64(*payload.SpeakingTime) / 60.0))
	}

	// AI assessment
	examType := "ACADEMIC"
	nativeLanguage := ""
	if session.User != nil {
		examType = string(session.User.ExamType)
		if session.User.NativeLanguage != nil {
			nativeLanguage = *session.User.NativeLanguage
		}
	}

	questionText := ""
	if session.Question != nil {
		questionText = session.Question.QuestionText
	}

	assessment, err := p.speechSvc.AssessSpeech(
		transcriptRes.result.Text,
		questionText,
		session.Part,
		examType,
		nativeLanguage,
	)
	if err != nil {
		return fmt.Errorf("assessment failed: %w", err)
	}

	// Save all results
	now := time.Now()
	updates := map[string]interface{}{
		"audio_url":                 uploadRes.key,
		"transcript":                transcriptRes.result.Text,
		"transcript_with_timestamps": transcriptRes.result.Timestamps,
		"overall_band_score":        assessment.OverallBandScore,
		"fluency_coherence_score":   assessment.FluencyCoherence,
		"lexical_resource_score":    assessment.LexicalResource,
		"grammar_accuracy_score":    assessment.GrammarAccuracy,
		"pronunciation_score":       assessment.Pronunciation,
		"words_per_minute":          metrics.WordsPerMinute,
		"total_words":               metrics.TotalWords,
		"filler_word_count":         metrics.FillerWordCount,
		"filler_words_detail":       metrics.FillerWordsDetail,
		"feedback_fluency":          assessment.FeedbackFluency,
		"feedback_vocabulary":       assessment.FeedbackVocabulary,
		"feedback_grammar":          assessment.FeedbackGrammar,
		"feedback_pronunciation":    assessment.FeedbackPronunciation,
		"feedback_overall":          assessment.FeedbackOverall,
		"vocabulary_suggestions":    assessment.VocabularySuggestions,
		"grammar_corrections":       assessment.GrammarCorrections,
		"mispronounced_words":       assessment.MispronouncedWords,
		"completed_at":              now,
	}

	if payload.PrepTime != nil {
		updates["prep_time_used_seconds"] = *payload.PrepTime
	}
	if payload.SpeakingTime != nil {
		updates["speaking_time_seconds"] = *payload.SpeakingTime
	}

	if err := p.db.Model(&models.PracticeSession{}).
		Where("id = ?", payload.SessionID).
		Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to save results: %w", err)
	}

	// Update user progress
	go p.practiceSvc.UpdateUserProgress(payload.UserID)

	log.Printf("Audio processing complete for session %s (score: %.1f)", payload.SessionID, assessment.OverallBandScore)
	return nil
}
