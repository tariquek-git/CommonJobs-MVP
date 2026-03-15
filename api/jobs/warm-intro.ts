import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../../lib/supabase.js';
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  const ip = getClientIP(req);
  if (rateLimitOrReject(ip, RATE_LIMITS.warmIntro, res)) return;

  try {
    const { job_id, name, email, linkedin, message } = req.body || {};

    if (!job_id || !name?.trim() || !email?.trim()) {
      return res.status(400).json({
        error: 'Name, email, and job ID are required',
        code: 'VALIDATION_ERROR',
      });
    }

    // Basic email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email', code: 'VALIDATION_ERROR' });
    }

    // Capture analytics metadata
    const ipHash = createHash('sha256').update(ip).digest('hex');
    const userAgent = (req.headers['user-agent'] as string) || null;
    const referrer = (req.headers['referer'] as string) || null;

    const supabase = getSupabase();

    // Store the intro request with analytics
    const { data: intro, error } = await supabase.from('warm_intros').insert({
      job_id,
      name: name.trim(),
      email: email.trim(),
      linkedin: linkedin?.trim() || null,
      message: message?.trim() || null,
      ip_hash: ipHash,
      user_agent: userAgent,
      referrer,
    }).select('id').single();

    if (error) {
      const { logger } = await import('../../lib/logger.js');
      logger.error('Warm intro insert error', { endpoint: 'warm-intro', error });
      return res.status(500).json({ error: 'Failed to save request', code: 'STORAGE_ERROR' });
    }

    // Send notification email to admin (non-blocking)
    sendAdminNotification(supabase, job_id, name.trim(), email.trim(), linkedin?.trim(), message?.trim(), intro?.id).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Your warm intro request has been submitted. I\'ll reach out to the job poster on your behalf.',
    });
  } catch (err) {
    const { logger } = await import('../../lib/logger.js');
    logger.error('Warm intro handler error', { endpoint: 'warm-intro', error: err });
    return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}

async function sendAdminNotification(
  supabase: ReturnType<typeof getSupabase>,
  jobId: string,
  name: string,
  email: string,
  linkedin?: string,
  message?: string,
  introId?: string,
) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  try {
    const { Resend } = await import('resend');
    const key = process.env.RESEND_API_KEY;
    if (!key || !adminEmail) return;

    const resend = new Resend(key);
    const { data: job } = await supabase
      .from('jobs')
      .select('title, company')
      .eq('id', jobId)
      .single();

    const jobLabel = job ? `${job.title} at ${job.company}` : `Job ${jobId}`;
    const safeName = escHtml(name);
    const safeEmail = escHtml(email);
    const safeJobLabel = escHtml(jobLabel);
    const safeLinkedin = linkedin ? escHtml(linkedin) : '';
    const safeMessage = message ? escHtml(message) : '';
    const subject = `Warm Intro Request: ${jobLabel}`;

    const result = await resend.emails.send({
      from: 'Fintech Commons <notifications@commonsjobs.com>',
      to: adminEmail,
      subject,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0A1628; margin-bottom: 8px;">New Warm Intro Request</h2>
          <p style="color: #64748B; font-size: 15px;"><strong>Role:</strong> ${safeJobLabel}</p>
          <p style="color: #64748B; font-size: 15px;"><strong>Name:</strong> ${safeName}</p>
          <p style="color: #64748B; font-size: 15px;"><strong>Email:</strong> ${safeEmail}</p>
          ${safeLinkedin ? `<p style="color: #64748B; font-size: 15px;"><strong>LinkedIn:</strong> <a href="${safeLinkedin}">${safeLinkedin}</a></p>` : ''}
          ${safeMessage ? `<p style="color: #64748B; font-size: 15px;"><strong>Message:</strong> ${safeMessage}</p>` : ''}
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 16px 0;" />
          <p style="color: #94A3B8; font-size: 13px;">— Fintech Commons</p>
        </div>
      `,
      text: `New Warm Intro Request\n\nRole: ${jobLabel}\nName: ${name}\nEmail: ${email}${linkedin ? `\nLinkedIn: ${linkedin}` : ''}${message ? `\nMessage: ${message}` : ''}`,
    });

    // Log email to DB
    try {
      await supabase.from('email_logs').insert({
        event_type: 'warm_intro_notification',
        recipient: adminEmail,
        subject,
        related_job_id: jobId,
        related_warm_intro_id: introId || null,
        status: 'sent',
        metadata: { resend_id: result?.data?.id },
      });
    } catch { /* non-critical */ }
  } catch (emailErr) {
    const { logger } = await import('../../lib/logger.js');
    logger.warn('Warm intro email failed', { endpoint: 'warm-intro', error: emailErr });

    // Log failed email
    try {
      await supabase.from('email_logs').insert({
        event_type: 'warm_intro_notification',
        recipient: adminEmail,
        subject: `Warm Intro Request (job ${jobId})`,
        related_job_id: jobId,
        related_warm_intro_id: introId || null,
        status: 'failed',
        error_message: emailErr instanceof Error ? emailErr.message : 'Unknown error',
      });
    } catch { /* non-critical */ }
  }
}
