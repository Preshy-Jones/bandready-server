//go:build ignore

package main

import (
	"log"
	"github.com/Preshy-Jones/bandready-server/internal/config"
	"github.com/Preshy-Jones/bandready-server/internal/database"
	"github.com/Preshy-Jones/bandready-server/internal/models"
	"github.com/google/uuid"
)

func main() {
	cfg := config.Load()
	db := database.Connect(cfg.DatabaseURL)

	questions := []models.SpeakingQuestion{
		{ID: uuid.New().String(), Part: 1, Topic: "Hometown", QuestionText: "Where are you from?", DifficultyLevel: "easy", IsActive: true},
		{ID: uuid.New().String(), Part: 2, Topic: "Describe a person", QuestionText: "Describe someone you admire.", DifficultyLevel: "medium", IsActive: true},
		{ID: uuid.New().String(), Part: 3, Topic: "Society", QuestionText: "How do role models influence society?", DifficultyLevel: "hard", IsActive: true},
	}

	for _, q := range questions {
		if err := db.FirstOrCreate(&q, "question_text = ?", q.QuestionText).Error; err != nil {
			log.Printf("Failed to seed question: %v", err)
		}
	}

	log.Println("Seed completed successfully")
}
