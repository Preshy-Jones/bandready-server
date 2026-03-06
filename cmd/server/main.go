package main

import (
	"fmt"
	"log"

	"github.com/Preshy-Jones/bandready-server/internal/admin/handler"
	adminservice "github.com/Preshy-Jones/bandready-server/internal/admin/service"
	authhandler "github.com/Preshy-Jones/bandready-server/internal/auth/handler"
	authservice "github.com/Preshy-Jones/bandready-server/internal/auth/service"
	"github.com/Preshy-Jones/bandready-server/internal/config"
	"github.com/Preshy-Jones/bandready-server/internal/database"
	"github.com/Preshy-Jones/bandready-server/internal/mail"
	"github.com/Preshy-Jones/bandready-server/internal/middleware"
	paymentshandler "github.com/Preshy-Jones/bandready-server/internal/payments/handler"
	paymentsservice "github.com/Preshy-Jones/bandready-server/internal/payments/service"
	"github.com/Preshy-Jones/bandready-server/internal/practice/handler"
	"github.com/Preshy-Jones/bandready-server/internal/practice/processor"
	practiceservice "github.com/Preshy-Jones/bandready-server/internal/practice/service"
	readinghandler "github.com/Preshy-Jones/bandready-server/internal/reading/handler"
	readingservice "github.com/Preshy-Jones/bandready-server/internal/reading/service"
	"github.com/Preshy-Jones/bandready-server/internal/tasks"
	usershandler "github.com/Preshy-Jones/bandready-server/internal/users/handler"
	usersservice "github.com/Preshy-Jones/bandready-server/internal/users/service"
	waitlisthandler "github.com/Preshy-Jones/bandready-server/internal/waitlist/handler"
	writinghandler "github.com/Preshy-Jones/bandready-server/internal/writing/handler"
	writingservice "github.com/Preshy-Jones/bandready-server/internal/writing/service"
	"github.com/gin-gonic/gin"
	"github.com/hibiken/asynq"
)

func main() {
	cfg := config.Load()
	db := database.Connect(cfg.DatabaseURL)

	// Services
	mailSvc := mail.New(cfg.ResendAPIKey, cfg.MailFrom)
	usersSvc := usersservice.New(db)
	authSvc := authservice.New(db, cfg, mailSvc)
	essaySvc := writingservice.New(db, cfg, usersSvc)
	readingSvc := readingservice.New(db)
	paymentsSvc := paymentsservice.New(db, cfg, mailSvc)
	adminSvc := adminservice.New(db, mailSvc)

	// Asynq (BullMQ equivalent)
	asynqClient := asynq.NewClient(asynq.RedisClientOpt{Addr: cfg.RedisURL})
	defer asynqClient.Close()

	speechSvc := practiceservice.NewSpeechService(cfg)
	s3Svc := practiceservice.NewS3Service(cfg)
	practiceSvc := practiceservice.NewPracticeService(db, usersSvc, asynqClient)

	// Handlers
	authH := authhandler.New(authSvc, cfg)
	usersH := usershandler.New(usersSvc)
	practiceH := practicehandler.New(practiceSvc)
	essayH := writinghandler.New(essaySvc)
	readingH := readinghandler.New(readingSvc)
	paymentsH := paymentshandler.New(paymentsSvc)
	adminH := adminhandler.New(adminSvc)
	waitlistH := waitlisthandler.New(db)

	// Start async worker
	asynqServer := asynq.NewServer(
		asynq.RedisClientOpt{Addr: cfg.RedisURL},
		asynq.Config{
			Queues: map[string]int{
				"audio-processing": 10,
				"default":          5,
			},
			RetryDelayFunc: asynq.DefaultRetryDelayFunc,
		},
	)

	audioProc := processor.New(db, speechSvc, s3Svc, practiceSvc, mailSvc)
	mux := asynq.NewServeMux()
	mux.HandleFunc(practiceservice.TypeAudioProcessing, audioProc.ProcessTask)

	go func() {
		if err := asynqServer.Run(mux); err != nil {
			log.Printf("Asynq server error: %v", err)
		}
	}()

	// Start cron scheduler
	scheduler := tasks.New(db, mailSvc)
	scheduler.Start()
	defer scheduler.Stop()

	// Router
	r := gin.Default()
	r.Use(middleware.CORS(cfg.FrontendURL, cfg.AdminURL))

	api := r.Group("/api")

	// Auth routes
	auth := api.Group("/auth")
	{
		auth.POST("/register", authH.Register)
		auth.POST("/login", authH.Login)
		auth.POST("/verify-otp", authH.VerifyOTP)
		auth.POST("/resend-otp", authH.ResendOTP)
		auth.POST("/forgot-password", authH.ForgotPassword)
		auth.POST("/reset-password", authH.ResetPassword)
		auth.GET("/google", authH.GoogleLogin)
		auth.GET("/google/callback", authH.GoogleCallback)
		auth.GET("/me", middleware.AuthMiddleware(cfg.JWTSecret), authH.Me)
		auth.GET("/logout", authH.Logout)
	}

	// User routes
	users := api.Group("/users", middleware.AuthMiddleware(cfg.JWTSecret))
	{
		users.GET("/profile", usersH.GetProfile)
		users.PUT("/profile", usersH.UpdateProfile)
		users.PUT("/goals", usersH.UpdateGoals)
	}

	// Practice routes
	practice := api.Group("/practice")
	{
		practice.GET("/topics/:part", practiceH.GetTopics)
		practice.GET("/question/:part", practiceH.GetRandomQuestion)

		authPractice := practice.Group("", middleware.AuthMiddleware(cfg.JWTSecret))
		authPractice.POST("/session/start", practiceH.StartSession)
		authPractice.POST("/session/submit", practiceH.SubmitSession)
		authPractice.GET("/session/:sessionId", practiceH.GetSession)
		authPractice.GET("/sessions", practiceH.GetSessions)
		authPractice.GET("/progress", practiceH.GetProgress)
		authPractice.GET("/diagnostic/start", practiceH.StartDiagnostic)
	}

	// Writing routes
	writing := api.Group("/writing")
	{
		writing.GET("/questions/:taskType", essayH.GetRandomQuestion)
		writing.GET("/questions/all/:taskType", essayH.GetAllQuestions)
		writing.GET("/questions/by-id/:questionId", essayH.GetQuestion)

		authWriting := writing.Group("", middleware.AuthMiddleware(cfg.JWTSecret))
		authWriting.POST("/essay/submit", essayH.SubmitEssay)
		authWriting.GET("/essay/:submissionId/feedback", essayH.GetFeedback)
		authWriting.GET("/essays", essayH.GetEssayHistory)
	}

	// Reading routes
	reading := api.Group("/reading")
	{
		reading.GET("", readingH.Status)
		reading.GET("/passages", readingH.GetPassages)
		reading.GET("/passages/:id", readingH.GetPassage)

		authReading := reading.Group("", middleware.AuthMiddleware(cfg.JWTSecret))
		authReading.GET("/recommended", readingH.GetRecommended)
		authReading.POST("/sessions", readingH.StartSession)
		authReading.GET("/sessions/:sessionId", readingH.GetSession)
		authReading.POST("/sessions/:sessionId/answers", readingH.SubmitAnswer)
		authReading.POST("/sessions/:sessionId/complete", readingH.CompleteSession)
		authReading.GET("/sessions/:sessionId/results", readingH.GetResults)
		authReading.GET("/progress", readingH.GetProgress)
	}

	// Payment routes (webhooks outside /api prefix)
	payments := api.Group("/payments")
	{
		payments.GET("/config", paymentsH.GetConfig)
		payments.GET("/provider", paymentsH.GetProvider)

		authPayments := payments.Group("", middleware.AuthMiddleware(cfg.JWTSecret))
		authPayments.GET("/billing/history", paymentsH.GetBillingHistory)
		authPayments.POST("/cancel", paymentsH.CancelSubscription)
		authPayments.POST("/paystack/initialize", paymentsH.InitializePaystack)
		authPayments.GET("/paystack/verify/:reference", paymentsH.VerifyPaystack)
		authPayments.POST("/paddle/checkout", paymentsH.InitializePaddle)
	}

	// Webhooks (outside global prefix - raw body needed)
	r.POST("/payments/paystack/webhook", paymentsH.PaystackWebhook)
	r.POST("/payments/paddle/webhook", paymentsH.PaddleWebhook)

	// Admin routes
	admin := api.Group("/admin",
		middleware.AuthMiddleware(cfg.JWTSecret),
		middleware.AdminMiddleware(),
	)
	{
		admin.GET("/analytics", adminH.GetAnalytics)
		admin.GET("/usage", adminH.GetUsageStats)
		admin.GET("/users", adminH.GetUsers)
		admin.GET("/users/:userId", adminH.GetUser)
		admin.POST("/users/:userId/credits", adminH.GrantCredits)
		admin.POST("/users/:userId/premium", adminH.GrantPremium)
		admin.POST("/users/:userId/deactivate", adminH.DeactivateUser)
		admin.GET("/users/export", adminH.ExportUsers)
		admin.POST("/content/speaking-questions", adminH.CreateSpeakingQuestion)
		admin.PUT("/content/speaking-questions/:id", adminH.UpdateSpeakingQuestion)
		admin.DELETE("/content/speaking-questions/:id", adminH.DeleteSpeakingQuestion)
		admin.POST("/content/writing-questions", adminH.CreateWritingQuestion)
		admin.PUT("/content/writing-questions/:id", adminH.UpdateWritingQuestion)
		admin.GET("/payments", adminH.GetPaymentAnalytics)
		admin.GET("/payments/settings", adminH.GetPaymentSettings)
		admin.PUT("/payments/settings/:key", adminH.UpdatePaymentSetting)
		admin.POST("/mail/send-to-user", adminH.SendToUser)
		admin.POST("/mail/broadcast", adminH.BroadcastEmail)
	}

	// Waitlist
	api.POST("/waitlist", waitlistH.Subscribe)

	log.Printf("BandReady server starting on port %s", cfg.Port)
	if err := r.Run(fmt.Sprintf(":%s", cfg.Port)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// dashboardRoutesAdded

// waitlistHandlerRegistered

// pr4Merged

// startupLogFixed

// redeployed
