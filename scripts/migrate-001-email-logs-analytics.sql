-- Migration 001: Email logs, analytics columns, missing indexes, warm_intro_ok fix
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. EMAIL LOGS TABLE — persist every email sent
-- ============================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,         -- 'warm_intro_notification', 'submission_notification', 'approval_notification'
  recipient TEXT NOT NULL,          -- email address
  subject TEXT NOT NULL,
  related_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  related_warm_intro_id UUID REFERENCES warm_intros(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'sent',  -- 'sent', 'failed', 'bounced'
  error_message TEXT,
  metadata JSONB DEFAULT '{}',      -- any extra context (resend message ID, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_event_type ON email_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_related_job ON email_logs(related_job_id);

-- RLS: service role only (no public access)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_logs_service_only ON email_logs
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 2. ANALYTICS COLUMNS on warm_intros
-- ============================================================
ALTER TABLE warm_intros ADD COLUMN IF NOT EXISTS ip_hash TEXT;
ALTER TABLE warm_intros ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE warm_intros ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE warm_intros ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';  -- 'pending', 'sent', 'connected', 'no_response'

-- ============================================================
-- 3. ANALYTICS COLUMNS on clicks
-- ============================================================
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS referrer TEXT;

-- ============================================================
-- 4. ANALYTICS COLUMNS on jobs (submission tracking)
-- ============================================================
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS submitter_ip_hash TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS submitter_user_agent TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS submitter_referrer TEXT;

-- ============================================================
-- 5. MISSING INDEXES on warm_intros
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_warm_intros_job_id ON warm_intros(job_id);
CREATE INDEX IF NOT EXISTS idx_warm_intros_created_at ON warm_intros(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_warm_intros_email ON warm_intros(email);
CREATE INDEX IF NOT EXISTS idx_warm_intros_status ON warm_intros(status);

-- ============================================================
-- 6. ENSURE warm_intro_ok column exists on jobs
-- ============================================================
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS warm_intro_ok BOOLEAN DEFAULT true;

-- ============================================================
-- 7. COMPOSITE INDEXES for common query patterns (scale)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_jobs_status_posted ON jobs(status, posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_job_clicked ON clicks(job_id, clicked_at DESC);

-- ============================================================
-- 8. RLS on warm_intros (if not already set)
-- ============================================================
ALTER TABLE warm_intros ENABLE ROW LEVEL SECURITY;

-- Public can insert (submit warm intro requests)
CREATE POLICY IF NOT EXISTS warm_intros_public_insert ON warm_intros
  FOR INSERT WITH CHECK (true);

-- Service role can do everything
CREATE POLICY IF NOT EXISTS warm_intros_service_all ON warm_intros
  FOR ALL USING (auth.role() = 'service_role');
