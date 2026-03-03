package tasks

import (
	"log"
	"time"

	"github.com/Preshy-Jones/bandready-server/internal/mail"
	"github.com/Preshy-Jones/bandready-server/internal/models"
	"github.com/robfig/cron/v3"
	"gorm.io/gorm"
)

type TaskScheduler struct {
	db      *gorm.DB
	mailSvc *mail.MailService
	cron    *cron.Cron
}

func New(db *gorm.DB, mailSvc *mail.MailService) *TaskScheduler {
	return &TaskScheduler{
		db:      db,
		mailSvc: mailSvc,
		cron:    cron.New(),
	}
}

func (t *TaskScheduler) Start() {
	// Every day at 9am
	t.cron.AddFunc("0 9 * * *", t.handleExamReminders)
	t.cron.AddFunc("0 9 * * *", t.handleSubscriptionExpiryReminders)
	t.cron.Start()
	log.Println("Cron scheduler started")
}

func (t *TaskScheduler) Stop() {
	t.cron.Stop()
}

func (t *TaskScheduler) handleExamReminders() {
	now := time.Now()
	reminderDays := []int{30, 14, 3}

	for _, days := range reminderDays {
		target := now.AddDate(0, 0, days)
		start := time.Date(target.Year(), target.Month(), target.Day(), 0, 0, 0, 0, time.UTC)
		end := start.AddDate(0, 0, 1)

		var users []models.User
		t.db.Where("target_exam_date >= ? AND target_exam_date < ?", start, end).Find(&users)

		for _, user := range users {
			fullName := ""
			if user.FullName != nil {
				fullName = *user.FullName
			}
			go t.mailSvc.SendExamReminder(user.Email, fullName, days)
		}

		log.Printf("Sent exam reminders (%d days) to %d users", days, len(users))
	}
}

func (t *TaskScheduler) handleSubscriptionExpiryReminders() {
	now := time.Now()
	reminderDays := []int{7, 1}

	for _, days := range reminderDays {
		target := now.AddDate(0, 0, days)
		start := time.Date(target.Year(), target.Month(), target.Day(), 0, 0, 0, 0, time.UTC)
		end := start.AddDate(0, 0, 1)

		var users []models.User
		t.db.Where(
			"subscription_tier = ? AND subscription_expires_at >= ? AND subscription_expires_at < ?",
			models.SubscriptionPremium, start, end,
		).Find(&users)

		for _, user := range users {
			fullName := ""
			if user.FullName != nil {
				fullName = *user.FullName
			}
			go t.mailSvc.SendSubscriptionExpiryReminder(user.Email, fullName, days)
		}

		log.Printf("Sent subscription expiry reminders (%d days) to %d users", days, len(users))
	}
}

// subscriptionExpiryAdded
