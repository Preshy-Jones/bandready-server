package authservice

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/Preshy-Jones/bandready-server/internal/config"
	"github.com/Preshy-Jones/bandready-server/internal/mail"
	"github.com/Preshy-Jones/bandready-server/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	db   *gorm.DB
	cfg  *config.Config
	mail *mail.MailService
}

func New(db *gorm.DB, cfg *config.Config, mail *mail.MailService) *AuthService {
	return &AuthService{db: db, cfg: cfg, mail: mail}
}

type RegisterInput struct {
	Email    string
	Password string
	FullName string
}

type LoginInput struct {
	Email    string
	Password string
}

type AuthResult struct {
	Token string
	User  *models.User
	IsNew bool
}

func (s *AuthService) Register(input RegisterInput) (*AuthResult, error) {
	var existing models.User
	if err := s.db.Where("email = ?", input.Email).First(&existing).Error; err == nil {
		return nil, errors.New("email already registered")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), 10)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	otp, otpExpiry := generateOTP()
	hashStr := string(hash)
	fullName := input.FullName

	user := models.User{
		ID:                         uuid.New().String(),
		Email:                      input.Email,
		PasswordHash:               &hashStr,
		FullName:                   &fullName,
		EmailVerificationOtp:       &otp,
		EmailVerificationOtpExpiry: &otpExpiry,
		Role:                       models.RoleUser,
		SubscriptionTier:           models.SubscriptionNone,
		ExamType:                   models.ExamAcademic,
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	go s.mail.SendVerificationOTP(user.Email, input.FullName, otp)

	token, err := s.generateToken(&user)
	if err != nil {
		return nil, err
	}

	return &AuthResult{Token: token, User: &user, IsNew: true}, nil
}

func (s *AuthService) Login(input LoginInput) (*AuthResult, error) {
	var user models.User
	if err := s.db.Where("email = ?", input.Email).First(&user).Error; err != nil {
		return nil, errors.New("invalid email or password")
	}

	if user.PasswordHash == nil {
		return nil, errors.New("please sign in with Google")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	token, err := s.generateToken(&user)
	if err != nil {
		return nil, err
	}

	return &AuthResult{Token: token, User: &user}, nil
}

func (s *AuthService) VerifyOTP(email, otp string) (*AuthResult, error) {
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, errors.New("user not found")
	}

	if user.EmailVerificationOtp == nil || *user.EmailVerificationOtp != otp {
		return nil, errors.New("invalid OTP")
	}

	if user.EmailVerificationOtpExpiry == nil || time.Now().After(*user.EmailVerificationOtpExpiry) {
		return nil, errors.New("OTP has expired")
	}

	if err := s.db.Model(&user).Updates(map[string]interface{}{
		"is_email_verified":            true,
		"email_verification_otp":       nil,
		"email_verification_otp_expiry": nil,
	}).Error; err != nil {
		return nil, err
	}

	token, err := s.generateToken(&user)
	if err != nil {
		return nil, err
	}

	return &AuthResult{Token: token, User: &user}, nil
}

func (s *AuthService) ResendOTP(email string) error {
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		return errors.New("user not found")
	}

	if user.IsEmailVerified {
		return errors.New("email already verified")
	}

	otp, expiry := generateOTP()
	if err := s.db.Model(&user).Updates(map[string]interface{}{
		"email_verification_otp":        otp,
		"email_verification_otp_expiry": expiry,
	}).Error; err != nil {
		return err
	}

	fullName := ""
	if user.FullName != nil {
		fullName = *user.FullName
	}
	go s.mail.SendVerificationOTP(email, fullName, otp)
	return nil
}

func (s *AuthService) ForgotPassword(email string) error {
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		// Don't reveal if email exists
		return nil
	}

	token := generateResetToken()
	hash := sha256Hash(token)
	expiry := time.Now().Add(1 * time.Hour)

	if err := s.db.Model(&user).Updates(map[string]interface{}{
		"password_reset_token_hash":   hash,
		"password_reset_token_expiry": expiry,
	}).Error; err != nil {
		return err
	}

	fullName := ""
	if user.FullName != nil {
		fullName = *user.FullName
	}
	go s.mail.SendPasswordResetEmail(email, fullName, token)
	return nil
}

func (s *AuthService) ResetPassword(token, newPassword string) error {
	hash := sha256Hash(token)

	var user models.User
	if err := s.db.Where("password_reset_token_hash = ?", hash).First(&user).Error; err != nil {
		return errors.New("invalid or expired reset token")
	}

	if user.PasswordResetTokenExpiry == nil || time.Now().After(*user.PasswordResetTokenExpiry) {
		return errors.New("reset token has expired")
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), 10)
	if err != nil {
		return err
	}

	hashStr := string(passwordHash)
	return s.db.Model(&user).Updates(map[string]interface{}{
		"password_hash":               hashStr,
		"password_reset_token_hash":   nil,
		"password_reset_token_expiry": nil,
	}).Error
}

func (s *AuthService) ValidateGoogleUser(googleID, email, name, avatarURL string) (*AuthResult, bool, error) {
	var user models.User
	isNew := false

	err := s.db.Where("google_id = ?", googleID).First(&user).Error
	if err == nil {
		token, err := s.generateToken(&user)
		return &AuthResult{Token: token, User: &user}, isNew, err
	}

	// Try to link to existing account by email
	err = s.db.Where("email = ?", email).First(&user).Error
	if err == nil {
		s.db.Model(&user).Updates(map[string]interface{}{
			"google_id":  googleID,
			"avatar_url": avatarURL,
		})
		token, err := s.generateToken(&user)
		return &AuthResult{Token: token, User: &user}, isNew, err
	}

	// Create new user
	isNew = true
	user = models.User{
		ID:               uuid.New().String(),
		Email:            email,
		GoogleID:         &googleID,
		FullName:         &name,
		AvatarURL:        &avatarURL,
		IsEmailVerified:  true,
		Role:             models.RoleUser,
		SubscriptionTier: models.SubscriptionNone,
		ExamType:         models.ExamAcademic,
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, false, err
	}

	token, err := s.generateToken(&user)
	return &AuthResult{Token: token, User: &user}, isNew, err
}

func (s *AuthService) GetUserByID(id string) (*models.User, error) {
	var user models.User
	if err := s.db.First(&user, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *AuthService) generateToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"role":  string(user.Role),
		"exp":   time.Now().Add(s.cfg.JWTExpiration).Unix(),
		"iat":   time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func generateOTP() (string, time.Time) {
	const digits = "0123456789"
	otp := make([]byte, 6)
	for i := range otp {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		otp[i] = digits[n.Int64()]
	}
	return string(otp), time.Now().Add(15 * time.Minute)
}

func generateResetToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func sha256Hash(input string) string {
	h := sha256.Sum256([]byte(input))
	return hex.EncodeToString(h[:])
}

// otpVerificationAdded - 6-digit OTP, 15min expiry

// forgotPasswordFlow - SHA256 token, 1hr expiry
