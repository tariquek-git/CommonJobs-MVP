import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../lib/auth.js';
import { getSupabase, getJobsTable } from '../../lib/supabase.js';
import { humanizeJobPost } from '../../lib/ai.js';
import type { Job } from '../../shared/types.js';

/**
 * POST /api/admin/backfill-summaries
 * Generates AI summaries for all active jobs that are missing them.
 * Admin-only. Run once to fix existing jobs.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!requireAdmin(req as unknown as Request)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = getSupabase();

    // Find active jobs with no summary but with a description
    const { data: jobs, error } = await supabase
      .from(getJobsTable())
      .select()
      .eq('status', 'active')
      .or('summary.is.null,summary.eq.')
      .not('description', 'is', null)
      .limit(20); // Process in batches to avoid timeout

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch jobs', details: error.message });
    }

    if (!jobs || jobs.length === 0) {
      return res.status(200).json({ message: 'No jobs need summaries', processed: 0 });
    }

    const results: { id: string; title: string; status: string }[] = [];

    for (const row of jobs) {
      const job = row as Job;
      try {
        const aiResult = await humanizeJobPost(job.description!, job.title, {
          company: job.company,
          location: job.location || undefined,
          country: job.country || undefined,
          company_url: job.company_url || undefined,
        });

        if (!aiResult.fallback && aiResult.result.humanized_description) {
          const updates: Record<string, unknown> = {
            summary: aiResult.result.humanized_description,
            updated_at: new Date().toISOString(),
          };
          if (aiResult.result.standout_perks?.length) {
            updates.standout_perks = aiResult.result.standout_perks;
          }
          if (!job.location && aiResult.result.location) updates.location = aiResult.result.location;
          if (!job.country && aiResult.result.country) updates.country = aiResult.result.country;
          if (!job.salary_range && aiResult.result.salary_range) updates.salary_range = aiResult.result.salary_range;
          if (!job.employment_type && aiResult.result.employment_type) updates.employment_type = aiResult.result.employment_type;
          if (!job.work_arrangement && aiResult.result.work_arrangement) updates.work_arrangement = aiResult.result.work_arrangement;

          await supabase.from(getJobsTable()).update(updates).eq('id', job.id);
          results.push({ id: job.id, title: job.title, status: 'updated' });
        } else {
          results.push({ id: job.id, title: job.title, status: 'ai_failed' });
        }
      } catch {
        results.push({ id: job.id, title: job.title, status: 'error' });
      }
    }

    return res.status(200).json({
      message: `Processed ${results.length} jobs`,
      processed: results.length,
      results,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
