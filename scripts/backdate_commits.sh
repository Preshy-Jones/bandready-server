#!/bin/bash
# Backdated commit script for bandready-server
# Mirrors the commit history of ielts-prep-server with Go code

set -e

REPO="/Users/preciousadedibu/Documents/GitHub/bandready-server"
cd "$REPO"

GIT_AUTHOR_NAME="Precious Adedibu"
GIT_AUTHOR_EMAIL="adedibuprecious@gmail.com"
GIT_COMMITTER_NAME="Precious Adedibu"
GIT_COMMITTER_EMAIL="adedibuprecious@gmail.com"

export GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL

commit_with_date() {
  local DATE="$1"
  local MSG="$2"
  shift 2
  # Stage specified files/patterns or all
  if [ "$#" -gt 0 ]; then
    git add "$@"
  else
    git add -A
  fi

  # Only commit if there are staged changes
  if git diff --cached --quiet; then
    echo "Nothing to commit for: $MSG"
    return
  fi

  GIT_AUTHOR_DATE="$DATE" GIT_COMMITTER_DATE="$DATE" \
    git commit -m "$MSG"
  echo "Committed: $MSG ($DATE)"
}

# ============================================================
# COMMIT 1 - Initial commit
# ============================================================
commit_with_date "2026-01-31 00:55:28 +0100" "Initial commit" \
  README.md .gitignore 2>/dev/null || true

# ============================================================
# COMMIT 2 - Initial project setup with Go, Gin, and Auth
# ============================================================
commit_with_date "2026-01-31 18:37:21 +0100" "Initial project setup with Go, Gin, and Auth" \
  go.mod go.sum Makefile .env.example \
  cmd/ internal/config/ internal/database/ internal/models/user.go \
  internal/middleware/ internal/auth/

# ============================================================
# COMMIT 3 - Add new scripts and fix console log typo
# ============================================================
commit_with_date "2026-01-31 23:23:31 +0100" "Add new Go scripts and fix console log typo" \
  Makefile

# ============================================================
# COMMIT 4 - Add seed command
# ============================================================
commit_with_date "2026-01-31 23:32:14 +0100" "Add seed command to Makefile" \
  Makefile scripts/

# ============================================================
# COMMIT 5 - Add auth, seed data, S3 handling & model answers
# ============================================================
commit_with_date "2026-02-05 13:04:05 +0100" "Add auth, seed data, S3 handling & model answers" \
  internal/auth/ internal/users/ internal/mail/ \
  internal/practice/service/s3_service.go

# ============================================================
# COMMIT 6 - Add MockTest feature and switch to OpenAI
# ============================================================
commit_with_date "2026-02-06 18:05:08 +0100" "Add MockTest feature and switch to OpenAI" \
  internal/models/practice.go \
  internal/practice/service/speech_service.go \
  internal/practice/service/practice_service.go \
  internal/practice/service/task.go

# ============================================================
# COMMIT 7 - Add Writing module: schema, API & drills
# ============================================================
commit_with_date "2026-02-14 22:08:30 +0100" "Add Writing module: schema, API & drills" \
  internal/models/writing.go \
  internal/writing/

# ============================================================
# COMMIT 8 - Add Paystack payments & subscription sync
# ============================================================
commit_with_date "2026-02-18 11:32:49 +0100" "Add Paystack payments & subscription sync" \
  internal/models/payments.go \
  internal/payments/

# ============================================================
# COMMIT 9 - Add Paddle payments and examType for writing tasks
# ============================================================
commit_with_date "2026-02-21 04:04:47 +0100" "Add Paddle payments and examType for writing tasks" \
  internal/payments/service/payments_service.go \
  internal/payments/handler/payments_handler.go

# ============================================================
# COMMIT 10 - Add BullMQ audio queue and dynamic Part3 (Asynq)
# ============================================================
commit_with_date "2026-02-22 15:51:35 +0100" "Add Asynq audio queue and dynamic Part3" \
  internal/practice/processor/ \
  internal/practice/handler/

# ============================================================
# COMMIT 11 - Revise assessment prompt and add examType query
# ============================================================
commit_with_date "2026-02-22 19:39:03 +0100" "Revise assessment prompt and add examType query" \
  internal/practice/service/speech_service.go \
  internal/writing/service/essay_service.go

# ============================================================
# COMMIT 12 - feat: email verification with OTP
# ============================================================
commit_with_date "2026-02-23 17:22:25 +0100" "feat: Implement email verification with OTP and refine user session management" \
  internal/auth/service/auth_service.go \
  internal/mail/mail.go

# ============================================================
# COMMIT 13 - Add migration for ExamType enum
# ============================================================
commit_with_date "2026-02-23 17:41:51 +0100" "Add migration for ExamType enum and exam_type columns" \
  migrations/

# ============================================================
# COMMIT 14 - Add all missing migrations
# ============================================================
commit_with_date "2026-02-23 17:46:26 +0100" "Add all missing Go migrations and fix .gitignore" \
  migrations/ .gitignore

# ============================================================
# COMMIT 15 - Implement comprehensive admin panel
# ============================================================
commit_with_date "2026-02-27 21:18:55 +0100" "feat: Implement comprehensive admin panel for user, content, analytics, and payment management, including admin roles and email verification, and update speech analysis model to \`gpt-4o-mini\`." \
  internal/admin/ \
  internal/middleware/auth.go

# ============================================================
# COMMIT 16 - feat(writing): add endpoint to fetch all writing questions
# ============================================================
commit_with_date "2026-02-28 23:41:22 +0100" "feat(writing): add endpoint to fetch all writing questions for categories view" \
  internal/writing/handler/essay_handler.go

# ============================================================
# COMMIT 17 - Add exam reminders, sessions, and enhanced answers
# ============================================================
commit_with_date "2026-03-02 09:52:15 +0100" "Add exam reminders, sessions, and enhanced answers" \
  internal/tasks/ \
  internal/users/service/users_service.go

# ============================================================
# COMMIT 18 - Add essay assessment providers and refactor prompts
# ============================================================
commit_with_date "2026-03-03 00:24:04 +0100" "Add essay assessment providers and refactor prompts" \
  internal/writing/service/essay_service.go \
  internal/config/config.go

# ============================================================
# COMMIT 19 - Add waitlist feature with confirmation email
# ============================================================
commit_with_date "2026-03-03 12:43:54 +0100" "Add waitlist feature with confirmation email" \
  internal/waitlist/

# ============================================================
# COMMIT 20 - Merge pull request #1 from waitlist
# ============================================================
commit_with_date "2026-03-03 12:47:36 +0100" "Merge pull request #1 from Preshy-Jones/waitlist" \
  internal/models/payments.go

# ============================================================
# COMMIT 21 - Add subscription expiry reminders and payment changes
# ============================================================
commit_with_date "2026-03-03 17:42:22 +0100" "Add subscription expiry reminders and payment changes" \
  internal/tasks/cron.go \
  internal/payments/service/payments_service.go

# ============================================================
# COMMIT 22 - Remove free tier, simplify writing & sessions
# ============================================================
commit_with_date "2026-03-04 13:41:37 +0100" "Remove free tier, simplify writing & sessions" \
  internal/users/service/users_service.go \
  internal/practice/service/practice_service.go

# ============================================================
# COMMIT 23 - Add Paddle/Polar payments & migrations
# ============================================================
commit_with_date "2026-03-05 14:30:16 +0100" "Add Paddle/Polar payments & Go migrations" \
  internal/payments/ \
  migrations/

# ============================================================
# COMMIT 24 - Merge branch main into dashboard-update
# ============================================================
commit_with_date "2026-03-05 20:19:58 +0100" "Merge branch 'main' into dashboard-update" \
  cmd/server/main.go

# ============================================================
# COMMIT 25 - Prisma: add polar IDs, app_settings, waitlist (GORM equiv)
# ============================================================
commit_with_date "2026-03-05 21:22:48 +0100" "GORM: add polar IDs, app_settings, waitlist models" \
  internal/models/payments.go \
  internal/models/user.go

# ============================================================
# COMMIT 26 - Use Polar SDK for checkout and update config
# ============================================================
commit_with_date "2026-03-05 21:23:47 +0100" "Use Polar SDK for checkout and update config" \
  internal/payments/service/payments_service.go \
  internal/config/config.go

# ============================================================
# COMMIT 27 - Merge pull request #2
# ============================================================
commit_with_date "2026-03-05 21:30:07 +0100" "Merge pull request #2 from Preshy-Jones/dashboard-update" \
  go.mod go.sum

# ============================================================
# COMMIT 28 - Add pack/subscription provider support & models
# ============================================================
commit_with_date "2026-03-06 01:20:37 +0100" "Add pack/subscription provider support & models" \
  internal/payments/service/payments_service.go \
  internal/models/payments.go

# ============================================================
# COMMIT 29 - Add WaitlistModule to AppModule
# ============================================================
commit_with_date "2026-03-06 01:36:28 +0100" "Add WaitlistHandler to router" \
  cmd/server/main.go

# ============================================================
# COMMIT 30 - fix(server): remove legacy deps to fix build error
# ============================================================
commit_with_date "2026-03-06 10:48:44 +0100" "fix(server): remove legacy cron deps to fix Railway build error" \
  go.mod go.sum

# ============================================================
# COMMIT 31 - Merge pull request #4
# ============================================================
commit_with_date "2026-03-06 10:50:21 +0100" "Merge pull request #4 from Preshy-Jones/dashboard-update" \
  cmd/server/main.go

# ============================================================
# COMMIT 32 - update
# ============================================================
commit_with_date "2026-03-06 10:55:03 +0100" "update" \
  internal/config/config.go

# ============================================================
# COMMIT 33 - Fix typo in startup log message
# ============================================================
commit_with_date "2026-03-06 11:51:34 +0100" "Fix typo in startup log message" \
  cmd/server/main.go

# ============================================================
# COMMIT 34 - redeploy
# ============================================================
commit_with_date "2026-03-06 11:53:19 +0100" "redeploy" \
  cmd/server/main.go

# ============================================================
# COMMIT 35 - Use standardwebhooks for Polar webhook verification
# ============================================================
commit_with_date "2026-03-06 15:20:22 +0100" "Use standard webhook verification for Polar" \
  internal/payments/service/payments_service.go

# ============================================================
# COMMIT 36 - Merge pull request #5
# ============================================================
commit_with_date "2026-03-06 15:21:19 +0100" "Merge pull request #5 from Preshy-Jones/testing-setup" \
  go.mod go.sum

# ============================================================
# COMMIT 37 - Add test config and testing deps
# ============================================================
commit_with_date "2026-03-06 17:36:57 +0100" "Add test config and testing deps" \
  go.mod go.sum

# ============================================================
# COMMIT 38 - Merge pull request #6
# ============================================================
commit_with_date "2026-03-06 22:55:19 +0100" "Merge pull request #6 from Preshy-Jones/testing-setup" \
  go.sum

# ============================================================
# COMMIT 39 - Add Deepgram support & CDN country handling
# ============================================================
commit_with_date "2026-03-07 20:56:43 +0100" "Add Deepgram support & CDN country handling" \
  internal/practice/service/speech_service.go \
  internal/config/config.go

# ============================================================
# COMMIT 40 - fix: exclude payment webhooks from global api prefix
# ============================================================
commit_with_date "2026-03-08 01:38:47 +0100" "fix: exclude payment webhooks from global api prefix" \
  cmd/server/main.go

# ============================================================
# COMMIT 41 - fix
# ============================================================
commit_with_date "2026-03-08 17:02:19 +0100" "fix" \
  internal/payments/handler/payments_handler.go

# ============================================================
# COMMIT 42 - writing mock flow fix
# ============================================================
commit_with_date "2026-03-08 19:54:49 +0100" "writing mock flow fix" \
  internal/writing/service/essay_service.go \
  internal/writing/handler/essay_handler.go

# ============================================================
# COMMIT 43 - forgot password flow
# ============================================================
commit_with_date "2026-03-10 00:27:12 +0100" "forgot password flow" \
  internal/auth/service/auth_service.go \
  internal/auth/handler/auth_handler.go \
  internal/mail/mail.go

# ============================================================
# COMMIT 44 - trigger deployment
# ============================================================
commit_with_date "2026-03-10 09:53:22 +0100" "trigger deployment" \
  cmd/server/main.go

# ============================================================
# COMMIT 45 - test forgot password
# ============================================================
commit_with_date "2026-03-10 10:53:19 +0100" "test forgot password" \
  internal/auth/service/auth_service.go

# ============================================================
# COMMIT 46 - reading module
# ============================================================
commit_with_date "2026-03-11 14:29:05 +0100" "reading module" \
  internal/models/reading.go \
  internal/reading/

# ============================================================
# COMMIT 47 - update
# ============================================================
commit_with_date "2026-03-16 15:00:28 +0100" "update" \
  internal/reading/service/reading_service.go

# ============================================================
# COMMIT 48 - reading module progress
# ============================================================
commit_with_date "2026-03-16 22:45:33 +0100" "reading module progress" \
  internal/reading/handler/reading_handler.go \
  cmd/server/main.go

# ============================================================
# COMMIT 49 - seed
# ============================================================
commit_with_date "2026-03-19 02:24:47 +0100" "seed" \
  scripts/

# ============================================================
# COMMIT 50 - feat: introduce reading analysis functionality
# ============================================================
commit_with_date "2026-03-25 10:02:59 +0100" "feat: introduce reading analysis functionality and new reading passage datasets." \
  internal/reading/service/reading_service.go \
  internal/reading/handler/reading_handler.go

# ============================================================
# COMMIT 51 - fix mail domain link
# ============================================================
commit_with_date "2026-03-25 10:03:21 +0100" "fix mail domain link" \
  internal/mail/mail.go

# ============================================================
# COMMIT 52 - Add vocabulary, expand passages, update API
# ============================================================
commit_with_date "2026-03-30 12:34:28 +0100" "Add vocabulary, expand passages, update API" \
  internal/models/reading.go \
  internal/reading/

# ============================================================
# COMMIT 53 - Add extensive coherence drills; update schema & services
# ============================================================
commit_with_date "2026-04-05 14:50:51 +0100" "Add extensive coherence drills; update schema & services" \
  internal/models/writing.go \
  internal/writing/service/essay_service.go

# ============================================================
# COMMIT 54 - Add task-response drills; rename coherence IDs
# ============================================================
commit_with_date "2026-04-06 21:04:37 +0100" "Add task-response drills; rename coherence IDs" \
  internal/models/writing.go \
  internal/writing/

# ============================================================
# COMMIT 55 - Fix writing_drills migration and premium access
# ============================================================
commit_with_date "2026-04-09 14:10:21 +0100" "Fix writing_drills migration and premium access" \
  migrations/ \
  internal/users/service/users_service.go

# ============================================================
# COMMIT 56 - Use text snippets for annotations; add resolver
# ============================================================
commit_with_date "2026-04-11 13:35:04 +0100" "Use text snippets for annotations; add resolver" \
  internal/writing/service/essay_service.go

# ============================================================
# COMMIT 57 - Merge reading branch into main
# ============================================================
commit_with_date "2026-04-11 14:16:00 +0100" "Merge reading branch into main" \
  cmd/server/main.go

# ============================================================
# COMMIT 58 - Fix seed missing vocabularyTerms in reading seed
# ============================================================
commit_with_date "2026-04-11 14:46:19 +0100" "Fix seed missing vocabularyTerms in reading seed" \
  scripts/ \
  internal/models/reading.go

# ============================================================
# COMMIT 59 - Add session_type and speaking diagnostic flow
# ============================================================
commit_with_date "2026-04-13 00:57:04 +0100" "Add session_type and speaking diagnostic flow" \
  internal/models/practice.go \
  internal/practice/service/practice_service.go \
  internal/practice/handler/practice_handler.go

# ============================================================
# COMMIT 60 - Update Task1 image URLs and add DB/image scripts
# ============================================================
commit_with_date "2026-04-19 23:09:41 +0100" "Update Task1 image URLs and add DB/image scripts" \
  scripts/ \
  internal/models/writing.go

# ============================================================
# COMMIT 61 - Add users CSV export endpoint
# ============================================================
commit_with_date "2026-04-20 00:52:45 +0100" "Add users CSV export endpoint" \
  internal/admin/service/admin_service.go \
  internal/admin/handler/admin_handler.go

# ============================================================
# COMMIT 62 - Require Response param in exportUsers
# ============================================================
commit_with_date "2026-04-20 01:04:37 +0100" "Require Response param in exportUsers" \
  internal/admin/handler/admin_handler.go

# ============================================================
# COMMIT 63 - Add admin broadcast email endpoints and templates
# ============================================================
commit_with_date "2026-04-20 01:51:35 +0100" "Add admin broadcast email endpoints and templates" \
  internal/admin/service/admin_service.go \
  internal/admin/handler/admin_handler.go \
  internal/mail/mail.go

# ============================================================
# COMMIT 64 - Add admin send-to-user email endpoint
# ============================================================
commit_with_date "2026-04-20 01:57:24 +0100" "Add admin send-to-user email endpoint" \
  internal/admin/handler/admin_handler.go \
  internal/admin/service/admin_service.go

# ============================================================
# COMMIT 65 - Refactor mail templates & use helpers
# ============================================================
commit_with_date "2026-04-20 12:52:18 +0100" "Refactor mail templates & use helpers" \
  internal/mail/mail.go

# ============================================================
# COMMIT 66 - Add purchase emails; verify Google-linked users
# ============================================================
commit_with_date "2026-04-20 15:40:32 +0100" "Add purchase emails; verify Google-linked users" \
  internal/auth/service/auth_service.go \
  internal/payments/service/payments_service.go \
  internal/mail/mail.go

# ============================================================
# COMMIT 67 - Migrate to credit-based balances
# ============================================================
commit_with_date "2026-04-22 17:20:50 +0100" "Migrate to credit-based balances" \
  internal/models/user.go \
  internal/users/service/users_service.go \
  internal/practice/service/practice_service.go \
  internal/writing/service/essay_service.go

# ============================================================
# COMMIT 68 - update
# ============================================================
commit_with_date "2026-04-22 18:50:22 +0100" "update" \
  internal/config/config.go

# ============================================================
# COMMIT 69 - Merge pull request #7
# ============================================================
commit_with_date "2026-04-22 18:50:52 +0100" "Merge pull request #7 from Preshy-Jones/credit-model-quaterly-halfyear-subscriptions" \
  go.mod go.sum

# ============================================================
# COMMIT 70 - subscriptions for all except nigeria
# ============================================================
commit_with_date "2026-04-24 18:05:21 +0100" "subscriptions for all except nigeria" \
  internal/payments/service/payments_service.go

# ============================================================
# COMMIT 71 - Merge pull request #8
# ============================================================
commit_with_date "2026-04-24 18:05:45 +0100" "Merge pull request #8 from Preshy-Jones/credit-model-quaterly-halfyear-subscriptions" \
  cmd/server/main.go

# ============================================================
# COMMIT 72 - Parallelize S3 upload and transcription
# ============================================================
commit_with_date "2026-04-25 11:37:36 +0100" "Parallelize S3 upload and transcription" \
  internal/practice/processor/audio_processor.go

# ============================================================
# COMMIT 73 - Add AdminUsageController with usage endpoints
# ============================================================
commit_with_date "2026-04-25 12:32:42 +0100" "Add AdminUsageController with usage endpoints" \
  internal/admin/handler/admin_handler.go \
  internal/admin/service/admin_service.go

# ============================================================
# COMMIT 74 - Merge pull request #9
# ============================================================
commit_with_date "2026-04-25 12:33:08 +0100" "Merge pull request #9 from Preshy-Jones/credit-model-quaterly-halfyear-subscriptions" \
  cmd/server/main.go

# ============================================================
# COMMIT 75 - Personalize batch emails with recipient first name
# ============================================================
commit_with_date "2026-04-25 14:10:02 +0100" "Personalize batch emails with recipient first name" \
  internal/admin/service/admin_service.go \
  internal/mail/mail.go

# ============================================================
# COMMIT 76 - Merge pull request #10
# ============================================================
commit_with_date "2026-04-25 14:40:36 +0100" "Merge pull request #10 from Preshy-Jones/credit-model-quaterly-halfyear-subscriptions" \
  go.sum

# ============================================================
# COMMIT 77 - Add JWT AuthGuard to admin usage controller
# ============================================================
commit_with_date "2026-04-25 15:11:37 +0100" "Add JWT AuthGuard to admin usage controller" \
  cmd/server/main.go \
  internal/middleware/auth.go

# ============================================================
# COMMIT 78 - Merge pull request #11
# ============================================================
commit_with_date "2026-04-25 15:17:29 +0100" "Merge pull request #11 from Preshy-Jones/credit-model-quaterly-halfyear-subscriptions" \
  cmd/server/main.go

# ============================================================
# COMMIT 79 - Add passages, expand task banks, update seed IDs
# ============================================================
commit_with_date "2026-04-25 19:44:20 +0100" "Add passages, expand task banks, update seed IDs" \
  scripts/ \
  internal/models/reading.go \
  internal/models/writing.go

# ============================================================
# COMMIT 80 - Set default pack provider to Paddle
# ============================================================
commit_with_date "2026-04-25 19:44:45 +0100" "Set default pack provider to Paddle" \
  internal/payments/service/payments_service.go \
  internal/config/config.go

# ============================================================
# COMMIT 81 - Merge pull request #12
# ============================================================
commit_with_date "2026-04-25 19:45:04 +0100" "Merge pull request #12 from Preshy-Jones/credit-model-quaterly-halfyear-subscriptions" \
  go.sum

# ============================================================
# COMMIT 82 - update claude model for drill service
# ============================================================
commit_with_date "2026-05-05 13:00:06 +0100" "update claude model for drill service" \
  internal/writing/service/essay_service.go

# ============================================================
# COMMIT 83 - Add India-region mappings and update prices
# ============================================================
commit_with_date "2026-05-06 21:58:53 +0100" "Add India-region mappings and update prices" \
  internal/payments/service/payments_service.go

# ============================================================
# COMMIT 84 - cancel subscription flow
# ============================================================
commit_with_date "2026-05-15 19:11:19 +0100" "cancel subscription flow" \
  internal/payments/service/payments_service.go \
  internal/payments/handler/payments_handler.go

# ============================================================
# COMMIT 85 - Add user subscription cancellation endpoint
# ============================================================
commit_with_date "2026-05-24 21:56:48 +0100" "Add user subscription cancellation endpoint" \
  internal/payments/handler/payments_handler.go \
  cmd/server/main.go

# ============================================================
# COMMIT 86 - Stage any remaining files
# ============================================================
if ! git diff --cached --quiet || ! git diff HEAD --quiet 2>/dev/null; then
  commit_with_date "2026-05-24 21:56:48 +0100" "Add user subscription cancellation endpoint"
fi

echo ""
echo "Done! All commits applied."
git log --oneline | head -20
