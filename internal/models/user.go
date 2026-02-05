package models

import (
	"time"
)

type SubscriptionTier string
type UserRole string
type ExamType string

const (
	SubscriptionNone    SubscriptionTier = "none"
	SubscriptionPremium SubscriptionTier = "premium"

	RoleUser  UserRole = "USER"
	RoleAdmin UserRole = "ADMIN"

	ExamAcademic        ExamType = "ACADEMIC"
	ExamGeneralTraining ExamType = "GENERAL_TRAINING"
)

type User struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	Email        string  `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash *string `gorm:"column:password_hash" json:"-"`
	FullName     *string `gorm:"column:full_name" json:"fullName"`
	GoogleID     *string `gorm:"column:google_id;uniqueIndex" json:"googleId,omitempty"`
	AvatarURL    *string `gorm:"column:avatar_url" json:"avatarUrl,omitempty"`

	TargetBandScore float64  `gorm:"column:target_band_score;default:7.0" json:"targetBandScore"`
	TargetExamDate  *time.Time `gorm:"column:target_exam_date" json:"targetExamDate,omitempty"`
	NativeLanguage  *string  `gorm:"column:native_language" json:"nativeLanguage,omitempty"`
	Country         *string  `json:"country,omitempty"`
	ExamType        ExamType `gorm:"column:exam_type;default:'ACADEMIC'" json:"examType"`

	SubscriptionTier      SubscriptionTier `gorm:"column:subscription_tier;default:'none'" json:"subscriptionTier"`
	SubscriptionExpiresAt *time.Time       `gorm:"column:subscription_expires_at" json:"subscriptionExpiresAt,omitempty"`

	PaystackCustomerCode   *string `gorm:"column:paystack_customer_code" json:"paystackCustomerCode,omitempty"`
	PaddleCustomerID       *string `gorm:"column:paddle_customer_id" json:"paddleCustomerId,omitempty"`
	PaddleSubscriptionID   *string `gorm:"column:paddle_subscription_id" json:"paddleSubscriptionId,omitempty"`
	PolarCustomerID        *string `gorm:"column:polar_customer_id" json:"polarCustomerId,omitempty"`

	IsEmailVerified          bool       `gorm:"column:is_email_verified;default:false" json:"isEmailVerified"`
	EmailVerificationOtp     *string    `gorm:"column:email_verification_otp" json:"-"`
	EmailVerificationOtpExpiry *time.Time `gorm:"column:email_verification_otp_expiry" json:"-"`
	PasswordResetTokenHash   *string    `gorm:"column:password_reset_token_hash" json:"-"`
	PasswordResetTokenExpiry *time.Time `gorm:"column:password_reset_token_expiry" json:"-"`

	CreditBalance int        `gorm:"column:credit_balance;default:0" json:"creditBalance"`
	DrillsExpireAt *time.Time `gorm:"column:drills_expire_at" json:"drillsExpireAt,omitempty"`

	Role UserRole `gorm:"default:'USER'" json:"role"`

	// Relations
	Progress          *UserProgress      `gorm:"foreignKey:UserID" json:"progress,omitempty"`
	WritingProgress   *WritingProgress   `gorm:"foreignKey:UserID" json:"writingProgress,omitempty"`
}

func (User) TableName() string { return "users" }
