CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE subscription_tier AS ENUM ('none', 'premium');
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE exam_type AS ENUM ('ACADEMIC', 'GENERAL_TRAINING');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT,
    google_id TEXT UNIQUE,
    avatar_url TEXT,
    target_band_score DECIMAL(2,1) NOT NULL DEFAULT 7.0,
    target_exam_date TIMESTAMPTZ,
    native_language TEXT,
    country TEXT,
    exam_type exam_type NOT NULL DEFAULT 'ACADEMIC',
    subscription_tier subscription_tier NOT NULL DEFAULT 'none',
    subscription_expires_at TIMESTAMPTZ,
    paystack_customer_code TEXT,
    paddle_customer_id TEXT,
    paddle_subscription_id TEXT,
    polar_customer_id TEXT,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_otp TEXT,
    email_verification_otp_expiry TIMESTAMPTZ,
    password_reset_token_hash TEXT,
    password_reset_token_expiry TIMESTAMPTZ,
    credit_balance INTEGER NOT NULL DEFAULT 0,
    drills_expire_at TIMESTAMPTZ,
    role user_role NOT NULL DEFAULT 'USER'
);
