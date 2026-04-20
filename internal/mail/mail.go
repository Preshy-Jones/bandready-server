package mail

import (
	"fmt"
	"log"

	"github.com/resend/resend-go/v2"
)

type MailService struct {
	client   *resend.Client
	from     string
	devMode  bool
}

func New(apiKey, from string) *MailService {
	devMode := apiKey == ""
	var client *resend.Client
	if !devMode {
		client = resend.NewClient(apiKey)
	}
	return &MailService{client: client, from: from, devMode: devMode}
}

func (m *MailService) send(to, subject, html string) error {
	if m.devMode {
		log.Printf("[MAIL DEV] To: %s | Subject: %s", to, subject)
		return nil
	}

	params := &resend.SendEmailRequest{
		From:    m.from,
		To:      []string{to},
		Subject: subject,
		Html:    html,
	}

	_, err := m.client.Emails.Send(params)
	return err
}

func (m *MailService) SendVerificationOTP(email, fullName, otp string) {
	subject := "Verify your BandReady account"
	html := fmt.Sprintf(`
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <h2>Welcome to BandReady, %s!</h2>
  <p>Your verification code is:</p>
  <h1 style="font-size:48px;letter-spacing:12px;color:#4F46E5">%s</h1>
  <p>This code expires in 15 minutes.</p>
  <p>If you didn't create an account, please ignore this email.</p>
</div>`, fullName, otp)

	if err := m.send(email, subject, html); err != nil {
		log.Printf("Failed to send verification OTP to %s: %v", email, err)
	}
}

func (m *MailService) SendPasswordResetEmail(email, fullName, token string) {
	subject := "Reset your BandReady password"
	resetLink := fmt.Sprintf("https://bandready.ai/reset-password?token=%s", token)
	html := fmt.Sprintf(`
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <h2>Password Reset Request</h2>
  <p>Hi %s,</p>
  <p>Click the link below to reset your password. This link expires in 1 hour.</p>
  <a href="%s" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Reset Password</a>
  <p>If you didn't request this, please ignore this email.</p>
</div>`, fullName, resetLink)

	if err := m.send(email, subject, html); err != nil {
		log.Printf("Failed to send password reset to %s: %v", email, err)
	}
}

func (m *MailService) SendExamReminder(email, fullName string, daysLeft int) {
	subject := fmt.Sprintf("Your IELTS exam is in %d days!", daysLeft)
	html := fmt.Sprintf(`
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <h2>IELTS Exam Reminder</h2>
  <p>Hi %s,</p>
  <p>Your IELTS exam is coming up in <strong>%d days</strong>!</p>
  <p>Keep up with your daily practice on BandReady to maximize your score.</p>
  <a href="https://bandready.ai/practice" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Practice Now</a>
</div>`, fullName, daysLeft)

	if err := m.send(email, subject, html); err != nil {
		log.Printf("Failed to send exam reminder to %s: %v", email, err)
	}
}

func (m *MailService) SendSubscriptionExpiryReminder(email, fullName string, daysLeft int) {
	subject := fmt.Sprintf("Your BandReady premium expires in %d day(s)", daysLeft)
	html := fmt.Sprintf(`
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <h2>Premium Subscription Expiring Soon</h2>
  <p>Hi %s,</p>
  <p>Your BandReady Premium subscription expires in <strong>%d day(s)</strong>.</p>
  <p>Renew now to keep your unlimited access.</p>
  <a href="https://bandready.ai/settings" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Renew Subscription</a>
</div>`, fullName, daysLeft)

	if err := m.send(email, subject, html); err != nil {
		log.Printf("Failed to send expiry reminder to %s: %v", email, err)
	}
}

func (m *MailService) SendPremiumWelcome(email, fullName string, expiresAt string) {
	subject := "Welcome to BandReady Premium!"
	html := fmt.Sprintf(`
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <h2>You're now Premium!</h2>
  <p>Hi %s,</p>
  <p>Welcome to BandReady Premium. You now have unlimited access to all speaking and writing practice sessions.</p>
  <p>Your subscription is active until <strong>%s</strong>.</p>
  <a href="https://bandready.ai/practice" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Start Practicing</a>
</div>`, fullName, expiresAt)

	if err := m.send(email, subject, html); err != nil {
		log.Printf("Failed to send premium welcome to %s: %v", email, err)
	}
}

func (m *MailService) SendPackConfirmation(email, fullName string, credits int) {
	subject := "Your BandReady credits are ready!"
	html := fmt.Sprintf(`
<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
  <h2>Credits Added!</h2>
  <p>Hi %s,</p>
  <p><strong>%d credits</strong> have been added to your account.</p>
  <p>Speaking sessions cost 5 credits. Writing sessions cost 2 credits.</p>
  <a href="https://bandready.ai/practice" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Start Practicing</a>
</div>`, fullName, credits)

	if err := m.send(email, subject, html); err != nil {
		log.Printf("Failed to send pack confirmation to %s: %v", email, err)
	}
}

func (m *MailService) SendCustom(to, subject, html string) error {
	return m.send(to, subject, html)
}

// passwordResetEmailAdded

// 1779810933

// 17798110

// 17798110
