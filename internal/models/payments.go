package models

import "time"

type PaymentProvider string
type TransactionStatus string

const (
	ProviderPaystack PaymentProvider = "paystack"
	ProviderPaddle   PaymentProvider = "paddle"
	ProviderPolar    PaymentProvider = "polar"

	StatusPending TransactionStatus = "PENDING"
	StatusSuccess TransactionStatus = "SUCCESS"
	StatusFailed  TransactionStatus = "FAILED"
)

type PaymentTransaction struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	UserID   string          `gorm:"type:uuid;not null;index" json:"userId"`
	Provider PaymentProvider `gorm:"not null" json:"provider"`
	Plan     string          `gorm:"not null" json:"plan"`

	AmountKobo  *int64  `gorm:"column:amount_kobo" json:"amountKobo,omitempty"`
	AmountCents *int64  `gorm:"column:amount_cents" json:"amountCents,omitempty"`
	Currency    *string `json:"currency,omitempty"`

	Reference           string  `gorm:"uniqueIndex;not null" json:"reference"`
	PaddleTransactionID *string `gorm:"column:paddle_transaction_id" json:"paddleTransactionId,omitempty"`
	PolarCheckoutID     *string `gorm:"column:polar_checkout_id" json:"polarCheckoutId,omitempty"`

	Status              TransactionStatus `gorm:"default:'PENDING'" json:"status"`
	PaidAt              *time.Time        `gorm:"column:paid_at" json:"paidAt,omitempty"`
	SubscriptionStartsAt *time.Time       `gorm:"column:subscription_starts_at" json:"subscriptionStartsAt,omitempty"`
	SubscriptionEndsAt  *time.Time        `gorm:"column:subscription_ends_at" json:"subscriptionEndsAt,omitempty"`

	Metadata interface{} `gorm:"serializer:json" json:"metadata,omitempty"`

	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (PaymentTransaction) TableName() string { return "payment_transactions" }

type AppSetting struct {
	Key       string    `gorm:"primaryKey" json:"key"`
	Value     string    `gorm:"not null" json:"value"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (AppSetting) TableName() string { return "app_settings" }

type Waitlist struct {
	ID        string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	FullName  *string   `gorm:"column:full_name" json:"fullName,omitempty"`
}

func (Waitlist) TableName() string { return "waitlist" }

// waitlistModelAdded
