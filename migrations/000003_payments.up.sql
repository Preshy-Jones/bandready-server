CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES users(id),
    provider TEXT NOT NULL,
    plan TEXT NOT NULL,
    amount_kobo BIGINT,
    amount_cents BIGINT,
    currency TEXT,
    reference TEXT UNIQUE NOT NULL,
    paddle_transaction_id TEXT,
    polar_checkout_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    paid_at TIMESTAMPTZ,
    subscription_starts_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,
    metadata JSONB
);

CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT
);
