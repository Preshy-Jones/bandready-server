# IELTS Speaking Practice App

AI-powered IELTS Speaking practice with real-time transcription and detailed feedback based on official IELTS band descriptors.

## 🎯 Features

- **Part 1, 2, 3 Practice**: Full coverage of all IELTS Speaking test parts
- **AI Assessment**: Claude-powered evaluation against official band descriptors
- **Real-time Transcription**: OpenAI Whisper for accurate speech-to-text
- **Detailed Feedback**: 
  - Score breakdown for all 4 criteria
  - Vocabulary suggestions
  - Grammar corrections
  - Filler word analysis
  - Speaking pace metrics
- **Progress Tracking**: Track improvement over time
- **Practice Streaks**: Stay motivated with daily practice tracking

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Next.js       │────▶│   NestJS API    │────▶│   PostgreSQL    │
│   Frontend      │     │   Backend       │     │   Database      │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │  OpenAI  │ │  Claude  │ │   S3/R2  │
              │  Whisper │ │   API    │ │  Storage │
              └──────────┘ └──────────┘ └──────────┘
```

## 📁 Project Structure

```
ielts-speaking-app/
├── backend/
│   ├── controllers/
│   │   └── practice.controller.ts    # API endpoints
│   ├── services/
│   │   └── speech-analysis.service.ts # Core AI logic
│   ├── prompts/
│   │   └── assessment-prompt.ts      # Claude grading prompts
│   ├── package.json
│   └── .env.example
├── database/
│   └── schema.sql                    # PostgreSQL schema
├── frontend/                         # (Generate with v0.dev)
└── V0_PROMPT.md                      # Frontend generation prompt
```

## 🚀 Quick Start

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb ielts_speaking

# Run schema
psql ielts_speaking < database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Generate Prisma client
npm run prisma:generate

# Start development server
npm run start:dev
```

### 3. Frontend Setup

1. Go to [v0.dev](https://v0.dev)
2. Paste the contents of `V0_PROMPT.md`
3. Generate and iterate on the frontend
4. Export to your codebase

## 🔑 API Keys Required

| Service | Purpose | Get Key |
|---------|---------|---------|
| Anthropic | Claude API for grading | [console.anthropic.com](https://console.anthropic.com) |
| OpenAI | Whisper for transcription | [platform.openai.com](https://platform.openai.com) |
| Cloudflare R2 | Audio storage | [dash.cloudflare.com](https://dash.cloudflare.com) |

## 💰 Cost Estimation

Per practice session (2 min audio):
- Whisper API: ~$0.012 (2 min × $0.006/min)
- Claude API: ~$0.02 (assessment prompt)
- **Total: ~$0.03 per session**

For 100 sessions/day: ~$3/day or ~$90/month

## 📊 API Endpoints

### Questions
```
GET  /api/practice/question/:part    # Get random question
GET  /api/practice/topics/:part      # Get available topics
```

### Sessions
```
POST /api/practice/session/start     # Start practice session
POST /api/practice/session/submit    # Submit recording
GET  /api/practice/session/:id       # Get session results
GET  /api/practice/sessions/:userId  # Get user history
```

### Progress
```
GET  /api/practice/progress/:userId  # Get user stats
```

## 🎨 Frontend Pages

1. **Dashboard** (`/dashboard`) - Overview and quick actions
2. **Practice Selection** (`/practice`) - Choose part and topic
3. **Practice Session** (`/practice/session/[id]`) - Recording interface
4. **Results** (`/practice/session/[id]/results`) - Feedback and scores
5. **History** (`/history`) - Past sessions
6. **Settings** (`/settings`) - Profile and preferences

## 🧠 AI Grading Logic

The Claude prompt is engineered to:
1. Assess against official IELTS band descriptors
2. Consider test part context (Part 1 vs Part 2 vs Part 3)
3. Analyze audio metrics (WPM, pauses, filler words)
4. Provide specific, actionable feedback
5. Return structured JSON for consistent UI display

See `backend/prompts/assessment-prompt.ts` for the full system prompt.

## 🔒 Free vs Premium Tiers

| Feature | Free | Premium |
|---------|------|---------|
| Daily sessions | 3 | Unlimited |
| Question bank | Full | Full |
| AI feedback | Full | Full |
| Progress tracking | Basic | Advanced |
| Model answers | ❌ | ✅ |
| Export data | ❌ | ✅ |

## 📱 Mobile Considerations

- PWA-ready with offline question caching
- Native-feel recording interface
- Responsive design for all screen sizes
- Touch-optimized interactions

## 🚢 Deployment

**Backend**: Railway, Render, or AWS ECS
**Frontend**: Vercel (Next.js)
**Database**: Supabase, Neon, or Railway Postgres
**Storage**: Cloudflare R2 (S3-compatible, generous free tier)

## 📝 License

MIT

---

Built with ❤️ for IELTS test takers everywhere.