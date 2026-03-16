import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase, getJobsTable } from '../../lib/supabase.js';
import { validateSubmission, sanitizeSubmission } from '../../shared/validation.js';
import type { SubmissionPayload, SubmissionResponse } from '../../shared/types.js';
import { getClientIP, rateLimitOrReject, RATE_LIMITS } from '../../lib/rate-limit.js';
import { createHash } from 'crypto';

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function generateRefId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const prefix = 'CJ';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${code}`;
}

function normalizeUrl(url: unknown): unknown {
  if (!url || typeof url !== 'string' || !url.trim()) return url;
  let u = url.trim();
  if (!u.startsWith('https://') && !u.startsWith('http://')) {
    u = 'https://' + u;
  }
  if (u.startsWith('http://')) {
    u = 'https://' + u.slice(7);
  }
  return u;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  const ip = getClientIP(req);
  if (rateLimitOrReject(ip, RATE_LIMITS.submission, res)) return;

  try {
    // Normalize URLs before validation
    if (req.body && typeof req.body === 'object') {
      req.body.apply_url = normalizeUrl(req.body.apply_url);
      req.body.company_url = normalizeUrl(req.body.company_url);
    }

    // Validate
    const validation = validateSubmission(req.body);

    if (!validation.valid) {
      // Spam detection: silently accept but don't save
      if (validation.errors.includes('__spam__')) {
        return res.status(200).json({
          success: true,
          submission_ref: generateRefId(),
          message: 'Job submitted for review.',
        } satisfies SubmissionResponse);
      }

      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validation.errors,
      });
    }

    // Sanitize
    const payload = sanitizeSubmission(req.body as SubmissionPayload);
    const submissionRef = generateRefId();

    // Attempt to resolve company logo from domain
    let companyLogoUrl: string | null = null;
    if (payload.company_url) {
      try {
        const domain = new URL(payload.company_url).hostname;
        companyLogoUrl = `https://logo.clearbit.com/${domain}`;
      } catch {
        // Ignore invalid URL
      }
    }

    // Capture analytics metadata
    const ipHash = createHash('sha256').update(ip).digest('hex');
    const userAgent = (req.headers['user-agent'] as string) || null;
    const referrer = (req.headers['referer'] as string) || null;

    const supabase = getSupabase();
    const { data: inserted, error } = await supabase.from(getJobsTable()).insert({
      title: payload.title,
      company: payload.company,
      location: payload.location || null,
      country: payload.country || null,
      description: payload.description || null,
      summary: payload.summary || null,
      apply_url: payload.apply_url || null,
      company_url: payload.company_url || null,
      company_logo_url: companyLogoUrl,
      source_type: 'direct',
      source_name: 'community',
      status: 'pending',
      posted_date: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      submission_ref: submissionRef,
      submitter_name: payload.submitter_name || null,
      submitter_email: payload.submitter_email || null,
      tags: payload.tags || [],
      standout_perks: payload.standout_perks || [],
      warm_intro_ok: payload.warm_intro_ok ?? true,
      salary_range: payload.salary_range || null,
      employment_type: payload.employment_type || null,
      work_arrangement: payload.work_arrangement || null,
      submitter_ip_hash: ipHash,
      submitter_user_agent: userAgent,
      submitter_referrer: referrer,
    }).select('id').single();

    if (error) {
      const { logger } = await import('../../lib/logger.js');
      logger.error('Submission insert error', { endpoint: 'submissions', error });
      return res.status(500).json({ error: 'Failed to save submission', code: 'STORAGE_ERROR' });
    }

    // Send notification email to admin (non-blocking)
    notifyAdmin(payload, submissionRef, inserted?.id).catch(() => {});

    return res.status(201).json({
      success: true,
      submission_ref: submissionRef,
      message: 'Job submitted for review. It will appear publicly once approved.',
    } satisfies SubmissionResponse);
  } catch (err) {
    const { logger } = await import('../../lib/logger.js');
    logger.error('Submission handler error', { endpoint: 'submissions', error: err });
    return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}

async function notifyAdmin(payload: SubmissionPayload, ref: string, jobId?: string) {
  try {
    const { Resend } = await import('resend');
    const key = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!key || !adminEmail) return;

    const resend = new Resend(key);
    const subject = `New Submission: ${payload.title} at ${payload.company} [${ref}]`;

    const result = await resend.emails.send({
      from: 'Fintech Commons <notifications@commonsjobs.com>',
      to: adminEmail,
      subject,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0A1628; margin-bottom: 8px;">New Job Submission</h2>
          <p style="color: #64748B; font-size: 15px;"><strong>Ref:</strong> ${escHtml(ref)}</p>
          <p style="color: #64748B; font-size: 15px;"><strong>Title:</strong> ${escHtml(payload.title)}</p>
          <p style="color: #64748B; font-size: 15px;"><strong>Company:</strong> ${escHtml(payload.company)}</p>
          ${payload.location ? `<p style="color: #64748B; font-size: 15px;"><strong>Location:</strong> ${escHtml(payload.location)}</p>` : ''}
          ${payload.submitter_name ? `<p style="color: #64748B; font-size: 15px;"><strong>Submitted by:</strong> ${escHtml(payload.submitter_name)} (${escHtml(payload.submitter_email || 'no email')})</p>` : ''}
          ${payload.warm_intro_ok ? '<p style="color: #059669; font-size: 15px;">✅ Warm intros enabled</p>' : '<p style="color: #9CA3AF; font-size: 15px;">❌ Warm intros disabled</p>'}
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 16px 0;" />
          <p style="color: #94A3B8; font-size: 13px;">Review in admin panel → /admin</p>
        </div>
      `,
      text: `New Job Submission\n\nRef: ${ref}\nTitle: ${payload.title}\nCompany: ${payload.company}\nLocation: ${payload.location || 'N/A'}\nSubmitter: ${payload.submitter_name || 'N/A'} (${payload.submitter_email || 'N/A'})\nWarm intros: ${payload.warm_intro_ok ? 'Yes' : 'No'}\n\nReview in admin panel.`,
    });

    // Log email to DB
    const supabase = getSupabase();
    try {
      await supabase.from('email_logs').insert({
        event_type: 'submission_notification',
        recipient: adminEmail,
        subject,
        related_job_id: jobId || null,
        status: 'sent',
        metadata: { resend_id: result?.data?.id },
      });
    } catch { /* non-critical */ }
  } catch (err) {
    const { logger } = await import('../../lib/logger.js');
    logger.warn('Submission notification email failed', { endpoint: 'submissions', error: err });

    // Log failed email
    try {
      const sb = getSupabase();
      await sb.from('email_logs').insert({
        event_type: 'submission_notification',
        recipient: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `New Submission: ${payload.title} at ${payload.company}`,
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
      });
    } catch { /* ignore */ }
  }
}
