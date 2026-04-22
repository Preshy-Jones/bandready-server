package config

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	FrontendURL string
	AdminURL    string

	DatabaseURL string

	JWTSecret     string
	JWTExpiration time.Duration

	GoogleClientID     string
	GoogleClientSecret string
	GoogleCallbackURL  string

	OpenAIAPIKey              string
	DeepgramAPIKey            string
	AnthropicAPIKey           string
	EssayAssessmentProvider   string

	AWSS3Bucket      string
	AWSRegion        string
	AWSS3Endpoint    string
	AWSAccessKeyID   string
	AWSSecretKey     string

	RedisURL string

	ResendAPIKey string
	MailFrom     string

	PaystackPublicKey string
	PaystackSecretKey string

	PaddleClientToken     string
	PaddleAPIKey          string
	PaddleEnvironment     string
	PaddleMonthlyPriceID  string
	PaddleQuarterlyPriceID string
	PaddleBiannualPriceID string
	PaddleYearlyPriceID   string

	PolarAccessToken    string
	PolarEnvironment    string
	PolarWebhookSecret  string
	PolarProductStarterID  string
	PolarProductStandardID string
	PolarProductProID      string
	PolarProductUltimateID string

	SentryDSN string
}

var AppConfig *Config

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	jwtExp := 7 * 24 * time.Hour

	cfg := &Config{
		Port:        getEnv("PORT", "3001"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),
		AdminURL:    getEnv("ADMIN_URL", "http://localhost:3002"),

		DatabaseURL: mustGetEnv("DATABASE_URL"),

		JWTSecret:     mustGetEnv("JWT_SECRET"),
		JWTExpiration: jwtExp,

		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleCallbackURL:  getEnv("GOOGLE_CALLBACK_URL", ""),

		OpenAIAPIKey:            getEnv("OPENAI_API_KEY", ""),
		DeepgramAPIKey:          getEnv("DEEPGRAM_API_KEY", ""),
		AnthropicAPIKey:         getEnv("ANTHROPIC_API_KEY", ""),
		EssayAssessmentProvider: getEnv("ESSAY_ASSESSMENT_PROVIDER", "anthropic"),

		AWSS3Bucket:   getEnv("AWS_S3_BUCKET", ""),
		AWSRegion:     getEnv("AWS_REGION", "auto"),
		AWSS3Endpoint: getEnv("AWS_S3_ENDPOINT", ""),
		AWSAccessKeyID: getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretKey:   getEnv("AWS_SECRET_ACCESS_KEY", ""),

		RedisURL: getEnv("REDIS_URL", "redis://localhost:6379"),

		ResendAPIKey: getEnv("RESEND_API_KEY", ""),
		MailFrom:     getEnv("MAIL_FROM", "noreply@bandready.ai"),

		PaystackPublicKey: getEnv("PAYSTACK_PUBLIC_KEY", ""),
		PaystackSecretKey: getEnv("PAYSTACK_SECRET_KEY", ""),

		PaddleClientToken:      getEnv("PADDLE_CLIENT_TOKEN", ""),
		PaddleAPIKey:           getEnv("PADDLE_API_KEY", ""),
		PaddleEnvironment:      getEnv("PADDLE_ENVIRONMENT", "sandbox"),
		PaddleMonthlyPriceID:   getEnv("PADDLE_MONTHLY_PRICE_ID", ""),
		PaddleQuarterlyPriceID: getEnv("PADDLE_QUARTERLY_PRICE_ID", ""),
		PaddleBiannualPriceID:  getEnv("PADDLE_BIANNUAL_PRICE_ID", ""),
		PaddleYearlyPriceID:    getEnv("PADDLE_YEARLY_PRICE_ID", ""),

		PolarAccessToken:       getEnv("POLAR_ACCESS_TOKEN", ""),
		PolarEnvironment:       getEnv("POLAR_ENVIRONMENT", "sandbox"),
		PolarWebhookSecret:     getEnv("POLAR_WEBHOOK_SECRET", ""),
		PolarProductStarterID:  getEnv("POLAR_PRODUCT_STARTER_ID", ""),
		PolarProductStandardID: getEnv("POLAR_PRODUCT_STANDARD_ID", ""),
		PolarProductProID:      getEnv("POLAR_PRODUCT_PRO_ID", ""),
		PolarProductUltimateID: getEnv("POLAR_PRODUCT_ULTIMATE_ID", ""),

		SentryDSN: getEnv("SENTRY_DSN", ""),
	}

	AppConfig = cfg
	return cfg
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustGetEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("Required environment variable %s is not set", key)
	}
	return v
}

// configUpdated

// cdnCountryHandlingAdded

// 17798110
