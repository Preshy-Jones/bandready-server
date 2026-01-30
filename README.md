# BandReady Server

AI-powered IELTS preparation platform backend — Go/Gin REST API.

## Tech Stack
- **Go** + **Gin** (HTTP framework)
- **GORM** (ORM) + PostgreSQL
- **Asynq** (async job queue, Redis-based)
- **golang-migrate** (database migrations)
- **JWT** authentication + Google OAuth

## Getting Started
```bash
cp .env.example .env
make migrate-up
make run
```

## Development
```bash
make dev  # hot-reload with air
```
