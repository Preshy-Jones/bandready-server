package models

import (
	"time"
)

type TaskType string
type DrillType string
type DrillCategory string
type WeaknessCategory string
type WeaknessStatus string
type DifficultyLevel string
type WritingSessionType string

const (
	TaskTypeTask1 TaskType = "TASK1"
	TaskTypeTask2 TaskType = "TASK2"

	DrillTypeMicro    DrillType = "MICRO_DRILL"
	DrillTypeTask1    DrillType = "TASK1_TRACK"
	DrillTypeTask2    DrillType = "TASK2_TRACK"

	CategoryGrammar      DrillCategory = "GRAMMAR"
	CategoryVocabulary   DrillCategory = "VOCABULARY"
	CategoryCoherence    DrillCategory = "COHERENCE"
	CategoryTaskResponse DrillCategory = "TASK_RESPONSE"

	WeaknessCategoryGrammar      WeaknessCategory = "GRAMMAR"
	WeaknessCategoryVocabulary   WeaknessCategory = "VOCABULARY"
	WeaknessCategoryCoherence    WeaknessCategory = "COHERENCE"
	WeaknessCategoryTaskResponse WeaknessCategory = "TASK_RESPONSE"

	WeaknessImproving  WeaknessStatus = "IMPROVING"
	WeaknessStagnant   WeaknessStatus = "STAGNANT"
	WeaknessWorsening  WeaknessStatus = "WORSENING"

	DifficultyEasy   DifficultyLevel = "EASY"
	DifficultyMedium DifficultyLevel = "MEDIUM"
	DifficultyHard   DifficultyLevel = "HARD"

	WritingSessionDiagnostic      WritingSessionType = "DIAGNOSTIC"
	WritingSessionPractice        WritingSessionType = "PRACTICE"
	WritingSessionDrill           WritingSessionType = "DRILL"
	WritingSessionExamSimulation  WritingSessionType = "EXAM_SIMULATION"
)

type WritingQuestion struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	TaskType string   `gorm:"column:task_type;not null" json:"taskType"`
	ExamType ExamType `gorm:"column:exam_type;default:'ACADEMIC'" json:"examType"`
	SubType  *string  `gorm:"column:sub_type" json:"subType,omitempty"`
	Prompt   string   `gorm:"type:text;not null" json:"prompt"`
	ImageURL *string  `gorm:"column:image_url" json:"imageUrl,omitempty"`
	IsActive bool     `gorm:"column:is_active;default:true" json:"isActive"`

	Submissions []EssaySubmission `gorm:"foreignKey:QuestionID" json:"submissions,omitempty"`
}

func (WritingQuestion) TableName() string { return "writing_questions" }

type EssaySubmission struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	UserID     string `gorm:"type:uuid;not null;index" json:"userId"`
	QuestionID string `gorm:"type:uuid;not null" json:"questionId"`

	EssayText        string `gorm:"column:essay_text;type:text;not null" json:"essayText"`
	WordCount        int    `gorm:"column:word_count;default:0" json:"wordCount"`
	TimeSpentSeconds int    `gorm:"column:time_spent_seconds;default:0" json:"timeSpentSeconds"`

	TaskResponseScore    *float64 `gorm:"column:task_response_score" json:"taskResponseScore,omitempty"`
	CoherenceCohesionScore *float64 `gorm:"column:coherence_cohesion_score" json:"coherenceCohesionScore,omitempty"`
	LexicalResourceScore  *float64 `gorm:"column:lexical_resource_score" json:"lexicalResourceScore,omitempty"`
	GrammarAccuracyScore  *float64 `gorm:"column:grammar_accuracy_score" json:"grammarAccuracyScore,omitempty"`
	OverallBandScore      *float64 `gorm:"column:overall_band_score" json:"overallBandScore,omitempty"`

	SessionType WritingSessionType `gorm:"column:session_type;default:'PRACTICE'" json:"sessionType"`
	SubmittedAt time.Time          `gorm:"column:submitted_at" json:"submittedAt"`

	User     *User            `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Question *WritingQuestion `gorm:"foreignKey:QuestionID" json:"question,omitempty"`
	Feedback *EssayFeedback   `gorm:"foreignKey:EssayID" json:"feedback,omitempty"`
}

func (EssaySubmission) TableName() string { return "essay_submissions" }

type EssayFeedback struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `json:"createdAt"`

	EssayID string `gorm:"type:uuid;uniqueIndex;not null" json:"essayId"`

	TaskResponseFeedback   *string `gorm:"column:task_response_feedback;type:text" json:"taskResponseFeedback,omitempty"`
	CoherenceCohesionFeedback *string `gorm:"column:coherence_cohesion_feedback;type:text" json:"coherenceCohesionFeedback,omitempty"`
	LexicalResourceFeedback *string `gorm:"column:lexical_resource_feedback;type:text" json:"lexicalResourceFeedback,omitempty"`
	GrammarAccuracyFeedback *string `gorm:"column:grammar_accuracy_feedback;type:text" json:"grammarAccuracyFeedback,omitempty"`
	OverallFeedback         *string `gorm:"column:overall_feedback;type:text" json:"overallFeedback,omitempty"`

	Annotations           interface{} `gorm:"serializer:json" json:"annotations,omitempty"`
	ExaminerInsights      interface{} `gorm:"column:examiner_insights;serializer:json" json:"examinerInsights,omitempty"`
	PriorityFixes         interface{} `gorm:"column:priority_fixes;serializer:json" json:"priorityFixes,omitempty"`
	DetectedErrors        interface{} `gorm:"column:detected_errors;serializer:json" json:"detectedErrors,omitempty"`
	VocabularySuggestions interface{} `gorm:"column:vocabulary_suggestions;serializer:json" json:"vocabularySuggestions,omitempty"`

	Essay *EssaySubmission `gorm:"foreignKey:EssayID" json:"essay,omitempty"`
}

func (EssayFeedback) TableName() string { return "essay_feedback" }

type WritingWeakness struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	UserID        string           `gorm:"type:uuid;not null;index" json:"userId"`
	Category      WeaknessCategory `gorm:"not null" json:"category"`
	SpecificError string           `gorm:"column:specific_error;not null" json:"specificError"`
	DisplayName   string           `gorm:"column:display_name;not null" json:"displayName"`
	Severity      string           `gorm:"default:'MEDIUM'" json:"severity"`
	Frequency     int              `gorm:"default:1" json:"frequency"`
	SessionsWithoutError int       `gorm:"column:sessions_without_error;default:0" json:"sessionsWithoutError"`
	Status        WeaknessStatus   `gorm:"default:'STAGNANT'" json:"status"`
	LastOccurrence time.Time       `gorm:"column:last_occurrence" json:"lastOccurrence"`
}

func (WritingWeakness) TableName() string { return "writing_weaknesses" }

type WritingDrill struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	Type          DrillType       `gorm:"not null" json:"type"`
	Category      DrillCategory   `gorm:"not null" json:"category"`
	SpecificSkill string          `gorm:"column:specific_skill;not null" json:"specificSkill"`
	Instruction   string          `gorm:"type:text;not null" json:"instruction"`
	Content       string          `gorm:"type:text;not null" json:"content"`
	CorrectAnswer string          `gorm:"column:correct_answer;type:text;not null" json:"correctAnswer"`
	Explanation   string          `gorm:"type:text;not null" json:"explanation"`
	Difficulty    DifficultyLevel `gorm:"default:'MEDIUM'" json:"difficulty"`
	TimeLimit     *int            `gorm:"column:time_limit" json:"timeLimit,omitempty"`
	RelatedWeaknesses interface{} `gorm:"column:related_weaknesses;serializer:json" json:"relatedWeaknesses,omitempty"`
	IsActive      bool            `gorm:"column:is_active;default:true" json:"isActive"`
}

func (WritingDrill) TableName() string { return "writing_drills" }

type DrillAttempt struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `json:"createdAt"`

	UserID           string  `gorm:"type:uuid;not null;index" json:"userId"`
	DrillID          string  `gorm:"type:uuid;not null;index" json:"drillId"`
	UserAnswer       string  `gorm:"column:user_answer;type:text;not null" json:"userAnswer"`
	IsCorrect        bool    `gorm:"column:is_correct" json:"isCorrect"`
	TimeSpentSeconds *int    `gorm:"column:time_spent_seconds" json:"timeSpentSeconds,omitempty"`
	AttemptedAt      time.Time `gorm:"column:attempted_at" json:"attemptedAt"`

	Drill *WritingDrill `gorm:"foreignKey:DrillID" json:"drill,omitempty"`
}

func (DrillAttempt) TableName() string { return "drill_attempts" }

type DrillReviewQueue struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	UserID             string  `gorm:"type:uuid;not null;index" json:"userId"`
	DrillID            string  `gorm:"type:uuid;not null" json:"drillId"`
	NextReviewAt       time.Time `gorm:"column:next_review_at" json:"nextReviewAt"`
	IntervalDays       float64   `gorm:"column:interval_days;default:1" json:"intervalDays"`
	EaseFactor         float64   `gorm:"column:ease_factor;default:2.5" json:"easeFactor"`
	ConsecutiveCorrect int       `gorm:"column:consecutive_correct;default:0" json:"consecutiveCorrect"`

	Drill *WritingDrill `gorm:"foreignKey:DrillID" json:"drill,omitempty"`
}

func (DrillReviewQueue) TableName() string { return "drill_review_queues" }

type WritingProgress struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UpdatedAt time.Time `json:"updatedAt"`

	UserID string `gorm:"type:uuid;uniqueIndex;not null" json:"userId"`

	AvgOverallScore  float64 `gorm:"column:avg_overall_score;default:0" json:"avgOverallScore"`
	AvgTaskResponse  float64 `gorm:"column:avg_task_response;default:0" json:"avgTaskResponse"`
	AvgCoherence     float64 `gorm:"column:avg_coherence;default:0" json:"avgCoherence"`
	AvgLexical       float64 `gorm:"column:avg_lexical;default:0" json:"avgLexical"`
	AvgGrammar       float64 `gorm:"column:avg_grammar;default:0" json:"avgGrammar"`
	AvgTask1Score    float64 `gorm:"column:avg_task1_score;default:0" json:"avgTask1Score"`
	AvgTask2Score    float64 `gorm:"column:avg_task2_score;default:0" json:"avgTask2Score"`

	TotalEssays          int `gorm:"column:total_essays;default:0" json:"totalEssays"`
	TotalDrillsCompleted int `gorm:"column:total_drills_completed;default:0" json:"totalDrillsCompleted"`
	TotalPracticeMinutes int `gorm:"column:total_practice_minutes;default:0" json:"totalPracticeMinutes"`

	Milestones    interface{} `gorm:"serializer:json" json:"milestones,omitempty"`
	ExamReadyTask1 bool       `gorm:"column:exam_ready_task1;default:false" json:"examReadyTask1"`
	ExamReadyTask2 bool       `gorm:"column:exam_ready_task2;default:false" json:"examReadyTask2"`
}

func (WritingProgress) TableName() string { return "writing_progress" }

// 1779810933

// 1779810933

// 17798110

// 17798110
