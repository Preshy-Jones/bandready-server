CREATE TABLE writing_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    task_type TEXT NOT NULL,
    exam_type TEXT NOT NULL DEFAULT 'ACADEMIC',
    sub_type TEXT,
    prompt TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE essay_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES users(id),
    question_id UUID NOT NULL REFERENCES writing_questions(id),
    essay_text TEXT NOT NULL,
    word_count INTEGER NOT NULL DEFAULT 0,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    task_response_score DECIMAL(2,1),
    coherence_cohesion_score DECIMAL(2,1),
    lexical_resource_score DECIMAL(2,1),
    grammar_accuracy_score DECIMAL(2,1),
    overall_band_score DECIMAL(2,1),
    session_type TEXT NOT NULL DEFAULT 'PRACTICE',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE essay_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    essay_id UUID UNIQUE NOT NULL REFERENCES essay_submissions(id),
    task_response_feedback TEXT,
    coherence_cohesion_feedback TEXT,
    lexical_resource_feedback TEXT,
    grammar_accuracy_feedback TEXT,
    overall_feedback TEXT,
    annotations JSONB,
    examiner_insights JSONB,
    priority_fixes JSONB,
    detected_errors JSONB,
    vocabulary_suggestions JSONB
);

CREATE TABLE writing_drills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    specific_skill TEXT NOT NULL,
    instruction TEXT NOT NULL,
    content TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'MEDIUM',
    time_limit INTEGER,
    related_weaknesses JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE drill_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES users(id),
    drill_id UUID NOT NULL REFERENCES writing_drills(id),
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE writing_weaknesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES users(id),
    category TEXT NOT NULL,
    specific_error TEXT NOT NULL,
    display_name TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'MEDIUM',
    frequency INTEGER NOT NULL DEFAULT 1,
    sessions_without_error INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'STAGNANT',
    last_occurrence TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, specific_error)
);

CREATE TABLE writing_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    avg_overall_score DECIMAL DEFAULT 0,
    avg_task_response DECIMAL DEFAULT 0,
    avg_coherence DECIMAL DEFAULT 0,
    avg_lexical DECIMAL DEFAULT 0,
    avg_grammar DECIMAL DEFAULT 0,
    avg_task1_score DECIMAL DEFAULT 0,
    avg_task2_score DECIMAL DEFAULT 0,
    total_essays INTEGER DEFAULT 0,
    total_drills_completed INTEGER DEFAULT 0,
    total_practice_minutes INTEGER DEFAULT 0,
    milestones JSONB,
    exam_ready_task1 BOOLEAN DEFAULT FALSE,
    exam_ready_task2 BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
