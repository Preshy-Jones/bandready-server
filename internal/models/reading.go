package models

import "time"

type ReadingTestType string
type ReadingMode string
type ReadingQuestionType string

const (
	ReadingTestAcademic        ReadingTestType = "ACADEMIC"
	ReadingTestGeneralTraining ReadingTestType = "GENERAL_TRAINING"

	ReadingModeFullTest              ReadingMode = "FULL_TEST"
	ReadingModeSinglePassage         ReadingMode = "SINGLE_PASSAGE"
	ReadingModeQuestionTypePractice  ReadingMode = "QUESTION_TYPE_PRACTICE"
	ReadingModeReview                ReadingMode = "REVIEW"
)

type ReadingPassage struct {
	ID              string          `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
	Title           string          `gorm:"not null" json:"title"`
	Content         string          `gorm:"type:text;not null" json:"content"`
	WordCount       int             `gorm:"column:word_count" json:"wordCount"`
	DifficultyLevel string          `gorm:"column:difficulty_level;default:'medium'" json:"difficultyLevel"`
	TestType        ReadingTestType `gorm:"column:test_type" json:"testType"`
	TopicCategory   string          `gorm:"column:topic_category" json:"topicCategory"`
	SourceAttribution *string       `gorm:"column:source_attribution" json:"sourceAttribution,omitempty"`
	VocabularyTerms interface{}     `gorm:"column:vocabulary_terms;serializer:json" json:"vocabularyTerms,omitempty"`
	IsActive        bool            `gorm:"column:is_active;default:true" json:"isActive"`

	Questions []ReadingQuestion `gorm:"foreignKey:PassageID" json:"questions,omitempty"`
}

func (ReadingPassage) TableName() string { return "reading_passages" }

type ReadingQuestion struct {
	ID             string `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PassageID      string `gorm:"type:uuid;not null;index" json:"passageId"`
	QuestionSetID  *string `gorm:"type:uuid;column:question_set_id" json:"questionSetId,omitempty"`
	QuestionType   string  `gorm:"column:question_type;not null" json:"questionType"`
	QuestionNumber int     `gorm:"column:question_number" json:"questionNumber"`
	QuestionData   interface{} `gorm:"column:question_data;serializer:json;not null" json:"questionData"`
	CorrectAnswer  interface{} `gorm:"column:correct_answer;serializer:json;not null" json:"correctAnswer"`
	Explanation    *string `gorm:"type:text" json:"explanation,omitempty"`
	SkillTested    *string `gorm:"column:skill_tested" json:"skillTested,omitempty"`

	Passage *ReadingPassage `gorm:"foreignKey:PassageID" json:"passage,omitempty"`
}

func (ReadingQuestion) TableName() string { return "reading_questions" }

type ReadingSession struct {
	ID              string          `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
	UserID          string          `gorm:"type:uuid;not null;index" json:"userId"`
	TestType        ReadingTestType `gorm:"column:test_type" json:"testType"`
	Mode            ReadingMode     `gorm:"default:'SINGLE_PASSAGE'" json:"mode"`
	IsTimed         bool            `gorm:"column:is_timed;default:true" json:"isTimed"`
	StartedAt       time.Time       `gorm:"column:started_at" json:"startedAt"`
	CompletedAt     *time.Time      `gorm:"column:completed_at" json:"completedAt,omitempty"`
	TimeSpentSeconds *int           `gorm:"column:time_spent_seconds" json:"timeSpentSeconds,omitempty"`
	PracticeFilters interface{}     `gorm:"column:practice_filters;serializer:json" json:"practiceFilters,omitempty"`

	Answers []ReadingAnswer `gorm:"foreignKey:SessionID" json:"answers,omitempty"`
	Results []ReadingResult `gorm:"foreignKey:SessionID" json:"results,omitempty"`
}

func (ReadingSession) TableName() string { return "reading_sessions" }

type ReadingAnswer struct {
	ID               string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	SessionID        string    `gorm:"type:uuid;not null;index" json:"sessionId"`
	QuestionID       string    `gorm:"type:uuid;not null" json:"questionId"`
	UserAnswer       interface{} `gorm:"column:user_answer;serializer:json" json:"userAnswer"`
	IsCorrect        bool      `gorm:"column:is_correct" json:"isCorrect"`
	TimeSpentSeconds *int      `gorm:"column:time_spent_seconds" json:"timeSpentSeconds,omitempty"`
	AnsweredAt       time.Time `gorm:"column:answered_at" json:"answeredAt"`

	Question *ReadingQuestion `gorm:"foreignKey:QuestionID" json:"question,omitempty"`
}

func (ReadingAnswer) TableName() string { return "reading_answers" }

type ReadingResult struct {
	ID                    string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	SessionID             string    `gorm:"type:uuid;not null;index" json:"sessionId"`
	RawScore              int       `gorm:"column:raw_score" json:"rawScore"`
	TotalQuestions        int       `gorm:"column:total_questions" json:"totalQuestions"`
	BandScore             float64   `gorm:"column:band_score" json:"bandScore"`
	QuestionTypeBreakdown interface{} `gorm:"column:question_type_breakdown;serializer:json" json:"questionTypeBreakdown,omitempty"`
	SkillBreakdown        interface{} `gorm:"column:skill_breakdown;serializer:json" json:"skillBreakdown,omitempty"`
	TimeManagement        interface{} `gorm:"column:time_management;serializer:json" json:"timeManagement,omitempty"`
	AIAnalysis            interface{} `gorm:"column:ai_analysis;serializer:json" json:"aiAnalysis,omitempty"`
	CompletionReason      *string   `gorm:"column:completion_reason" json:"completionReason,omitempty"`
	CreatedAt             time.Time `json:"createdAt"`
}

func (ReadingResult) TableName() string { return "reading_results" }

type ReadingProgress struct {
	ID             string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID         string    `gorm:"type:uuid;not null;index" json:"userId"`
	QuestionType   string    `gorm:"column:question_type;not null" json:"questionType"`
	Attempts       int       `gorm:"default:0" json:"attempts"`
	Correct        int       `gorm:"default:0" json:"correct"`
	AccuracyRate   *float64  `gorm:"column:accuracy_rate" json:"accuracyRate,omitempty"`
	LastPracticedAt *time.Time `gorm:"column:last_practiced_at" json:"lastPracticedAt,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

func (ReadingProgress) TableName() string { return "reading_progress" }

// 1779810933
