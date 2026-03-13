import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabase } from '../../lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

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

    const supabase = getSupabase();

    // Store the intro request
    const { error } = await supabase.from('warm_intros').insert({
      job_id,
      name: name.trim(),
      email: email.trim(),
      linkedin: linkedin?.trim() || null,
      message: message?.trim() || null,
    });

    if (error) {
      console.error('Warm intro insert error:', error);
      return res.status(500).json({ error: 'Failed to save request', code: 'STORAGE_ERROR' });
    }

    // Send notification email to admin (fire and forget)
    try {
      const { Resend } = await import('resend');
      const key = process.env.RESEND_API_KEY;
      if (key) {
        const resend = new Resend(key);
        // Look up the job title for the email
        const { data: job } = await supabase
          .from('jobs')
          .select('title, company')
          .eq('id', job_id)
          .single();

        const jobLabel = job ? `${job.title} at ${job.company}` : `Job ${job_id}`;

        await resend.emails.send({
          from: 'Fintech Commons <notifications@commonsjobs.com>',
          to: 'tarique@fintechcommons.com',
          subject: `Warm Intro Request: ${jobLabel}`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #0A1628; margin-bottom: 8px;">New Warm Intro Request</h2>
              <p style="color: #64748B; font-size: 15px;"><strong>Role:</strong> ${jobLabel}</p>
              <p style="color: #64748B; font-size: 15px;"><strong>Name:</strong> ${name.trim()}</p>
              <p style="color: #64748B; font-size: 15px;"><strong>Email:</strong> ${email.trim()}</p>
              ${linkedin?.trim() ? `<p style="color: #64748B; font-size: 15px;"><strong>LinkedIn:</strong> <a href="${linkedin.trim()}">${linkedin.trim()}</a></p>` : ''}
              ${message?.trim() ? `<p style="color: #64748B; font-size: 15px;"><strong>Message:</strong> ${message.trim()}</p>` : ''}
              <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 16px 0;" />
              <p style="color: #94A3B8; font-size: 13px;">— Fintech Commons</p>
            </div>
          `,
          text: `New Warm Intro Request\n\nRole: ${jobLabel}\nName: ${name.trim()}\nEmail: ${email.trim()}${linkedin?.trim() ? `\nLinkedIn: ${linkedin.trim()}` : ''}${message?.trim() ? `\nMessage: ${message.trim()}` : ''}`,
        });
      }
    } catch (emailErr) {
      console.error('Warm intro email error:', emailErr);
      // Non-blocking — intro is still saved
    }

    return res.status(201).json({
      success: true,
      message: 'Your warm intro request has been submitted. We\'ll reach out to the job poster on your behalf.',
    });
  } catch (err) {
    console.error('Warm intro error:', err);
    return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}
