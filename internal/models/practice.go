package models

import (
	"time"

	"github.com/lib/pq"
)

type SessionType string
type TimingMode string
type MockTestStatus string

const (
	SessionTypePractice        SessionType = "PRACTICE"
	SessionTypeDiagnostic      SessionType = "DIAGNOSTIC"
	SessionTypeExamSimulation  SessionType = "EXAM_SIMULATION"
	SessionTypeDrill           SessionType = "DRILL"

	TimingModeFlexible TimingMode = "flexible"
	TimingModeStrict   TimingMode = "strict"

	MockTestInProgress MockTestStatus = "in_progress"
	MockTestCompleted  MockTestStatus = "completed"
)

type SpeakingQuestion struct {
	ID              string         `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Part            int            `gorm:"not null" json:"part"`
	Topic           string         `gorm:"not null" json:"topic"`
	QuestionText    string         `gorm:"column:question_text;not null" json:"questionText"`
	CueCardPoints   pq.StringArray `gorm:"column:cue_card_points;type:text[]" json:"cueCardPoints,omitempty"`
	RelatedPart2Topic *string      `gorm:"column:related_part2_topic" json:"relatedPart2Topic,omitempty"`
	DifficultyLevel string         `gorm:"column:difficulty_level;default:'medium'" json:"difficultyLevel"`
	IsActive        bool           `gorm:"column:is_active;default:true" json:"isActive"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
}

func (SpeakingQuestion) TableName() string { return "speaking_questions" }

type PracticeSession struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	UserID     string `gorm:"type:uuid;not null;index" json:"userId"`
	QuestionID string `gorm:"type:uuid;not null" json:"questionId"`
	Part       int    `gorm:"not null" json:"part"`

	AudioURL              *string  `gorm:"column:audio_url" json:"audioUrl,omitempty"`
	AudioDurationSeconds  *float64 `gorm:"column:audio_duration_seconds" json:"audioDurationSeconds,omitempty"`
	Transcript            *string  `json:"transcript,omitempty"`
	TranscriptWithTimestamps interface{} `gorm:"column:transcript_with_timestamps;serializer:json" json:"transcriptWithTimestamps,omitempty"`

	OverallBandScore    *float64 `gorm:"column:overall_band_score" json:"overallBandScore,omitempty"`
	FluencyCoherenceScore *float64 `gorm:"column:fluency_coherence_score" json:"fluencyCoherenceScore,omitempty"`
	LexicalResourceScore  *float64 `gorm:"column:lexical_resource_score" json:"lexicalResourceScore,omitempty"`
	GrammarAccuracyScore  *float64 `gorm:"column:grammar_accuracy_score" json:"grammarAccuracyScore,omitempty"`
	PronunciationScore    *float64 `gorm:"column:pronunciation_score" json:"pronunciationScore,omitempty"`

	WordsPerMinute  *int `gorm:"column:words_per_minute" json:"wordsPerMinute,omitempty"`
	TotalWords      *int `gorm:"column:total_words" json:"totalWords,omitempty"`
	FillerWordCount *int `gorm:"column:filler_word_count" json:"fillerWordCount,omitempty"`
	FillerWordsDetail interface{} `gorm:"column:filler_words_detail;serializer:json" json:"fillerWordsDetail,omitempty"`
	PauseCount      *int `gorm:"column:pause_count" json:"pauseCount,omitempty"`
	LongPauseCount  *int `gorm:"column:long_pause_count" json:"longPauseCount,omitempty"`
	PauseLocations  interface{} `gorm:"column:pause_locations;serializer:json" json:"pauseLocations,omitempty"`

	FeedbackFluency     *string `gorm:"column:feedback_fluency;type:text" json:"feedbackFluency,omitempty"`
	FeedbackVocabulary  *string `gorm:"column:feedback_vocabulary;type:text" json:"feedbackVocabulary,omitempty"`
	FeedbackGrammar     *string `gorm:"column:feedback_grammar;type:text" json:"feedbackGrammar,omitempty"`
	FeedbackPronunciation *string `gorm:"column:feedback_pronunciation;type:text" json:"feedbackPronunciation,omitempty"`
	FeedbackOverall     *string `gorm:"column:feedback_overall;type:text" json:"feedbackOverall,omitempty"`

	VocabularySuggestions interface{} `gorm:"column:vocabulary_suggestions;serializer:json" json:"vocabularySuggestions,omitempty"`
	GrammarCorrections    interface{} `gorm:"column:grammar_corrections;serializer:json" json:"grammarCorrections,omitempty"`
	MispronouncedWords    interface{} `gorm:"column:mispronounced_words;serializer:json" json:"mispronouncedWords,omitempty"`

	ModelAnswer         *string `gorm:"column:model_answer;type:text" json:"modelAnswer,omitempty"`
	EnhancedModelAnswer interface{} `gorm:"column:enhanced_model_answer;serializer:json" json:"enhancedModelAnswer,omitempty"`

	SessionType          SessionType `gorm:"column:session_type;default:'PRACTICE'" json:"sessionType"`
	PrepTimeUsedSeconds  *int        `gorm:"column:prep_time_used_seconds" json:"prepTimeUsedSeconds,omitempty"`
	SpeakingTimeSeconds  *int        `gorm:"column:speaking_time_seconds" json:"speakingTimeSeconds,omitempty"`
	CompletedAt          *time.Time  `gorm:"column:completed_at" json:"completedAt,omitempty"`
	MockTestID           *string     `gorm:"type:uuid;column:mock_test_id" json:"mockTestId,omitempty"`
	QuestionNumber       *int        `gorm:"column:question_number" json:"questionNumber,omitempty"`

	// Relations
	User     *User            `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Question *SpeakingQuestion `gorm:"foreignKey:QuestionID" json:"question,omitempty"`
}

func (PracticeSession) TableName() string { return "practice_sessions" }

type UserProgress struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UpdatedAt time.Time `json:"updatedAt"`

	UserID string `gorm:"type:uuid;uniqueIndex;not null" json:"userId"`

	AvgOverallScore      float64 `gorm:"column:avg_overall_score;default:0" json:"avgOverallScore"`
	AvgFluencyScore      float64 `gorm:"column:avg_fluency_score;default:0" json:"avgFluencyScore"`
	AvgLexicalScore      float64 `gorm:"column:avg_lexical_score;default:0" json:"avgLexicalScore"`
	AvgGrammarScore      float64 `gorm:"column:avg_grammar_score;default:0" json:"avgGrammarScore"`
	AvgPronunciationScore float64 `gorm:"column:avg_pronunciation_score;default:0" json:"avgPronunciationScore"`

	TotalSessions        int `gorm:"column:total_sessions;default:0" json:"totalSessions"`
	TotalPracticeMinutes int `gorm:"column:total_practice_minutes;default:0" json:"totalPracticeMinutes"`

	CurrentStreakDays int        `gorm:"column:current_streak_days;default:0" json:"currentStreakDays"`
	LongestStreakDays int        `gorm:"column:longest_streak_days;default:0" json:"longestStreakDays"`
	LastPracticeDate  *time.Time `gorm:"column:last_practice_date" json:"lastPracticeDate,omitempty"`

	WeakAreas   interface{} `gorm:"column:weak_areas;serializer:json" json:"weakAreas,omitempty"`
	StrongAreas interface{} `gorm:"column:strong_areas;serializer:json" json:"strongAreas,omitempty"`

	Part1AvgScore float64 `gorm:"column:part1_avg_score;default:0" json:"part1AvgScore"`
	Part2AvgScore float64 `gorm:"column:part2_avg_score;default:0" json:"part2AvgScore"`
	Part3AvgScore float64 `gorm:"column:part3_avg_score;default:0" json:"part3AvgScore"`
}

func (UserProgress) TableName() string { return "user_progress" }

type MockTest struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	UserID          string         `gorm:"type:uuid;not null;index" json:"userId"`
	TimingMode      TimingMode     `gorm:"column:timing_mode;default:'flexible'" json:"timingMode"`
	CurrentPart     int            `gorm:"column:current_part;default:1" json:"currentPart"`
	CurrentQuestion int            `gorm:"column:current_question;default:1" json:"currentQuestion"`
	Status          MockTestStatus `gorm:"default:'in_progress'" json:"status"`
	QuestionSequence interface{}   `gorm:"column:question_sequence;serializer:json" json:"questionSequence,omitempty"`
	Part2Topic      *string        `gorm:"column:part2_topic" json:"part2Topic,omitempty"`
	OverallScore    *float64       `gorm:"column:overall_score" json:"overallScore,omitempty"`
	CrossPartAnalysis interface{}  `gorm:"column:cross_part_analysis;serializer:json" json:"crossPartAnalysis,omitempty"`
	StartedAt       time.Time      `gorm:"column:started_at" json:"startedAt"`
	CompletedAt     *time.Time     `gorm:"column:completed_at" json:"completedAt,omitempty"`

	User     *User             `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Sessions []PracticeSession `gorm:"foreignKey:MockTestID" json:"sessions,omitempty"`
}

func (MockTest) TableName() string { return "mock_tests" }

// 17798110
