import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../../../lib/auth.js';
import { getSupabase } from '../../../../lib/supabase.js';

const VALID_STATUSES = ['pending', 'contacted', 'connected', 'no_response'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  if (!requireAdmin(req as unknown as Request)) {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }

  const id = req.query.id as string;
  if (!id) {
    return res.status(400).json({ error: 'Missing intro ID', code: 'VALIDATION_ERROR' });
  }

  const { status } = req.body || {};
  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      code: 'VALIDATION_ERROR',
    });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('warm_intros')
      .update({ status })
      .eq('id', id)
      .select('id, status')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update status', code: 'UPDATE_ERROR' });
    }

    return res.status(200).json({ success: true, intro: data });
  } catch {
    return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}
