import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeAndExtract } from '../../lib/ai.js';
import { getClientIP, rateLimitOrReject, RATE_LIMITS } from '../../lib/rate-limit.js';

// Block requests to private/internal IP ranges (SSRF protection)
function isPrivateHostname(hostname: string): boolean {
  // Block localhost variants
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') {
    return true;
  }
  // Block common private/internal ranges
  const parts = hostname.split('.');
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
    const [a, b] = parts.map(Number);
    if (a === 10) return true;                          // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12
    if (a === 192 && b === 168) return true;             // 192.168.0.0/16
    if (a === 169 && b === 254) return true;             // 169.254.0.0/16 (link-local / cloud metadata)
    if (a === 0) return true;                            // 0.0.0.0/8
  }
  // Block metadata endpoints
  if (hostname === 'metadata.google.internal' || hostname === 'metadata.google.com') {
    return true;
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  const ip = getClientIP(req);
  if (rateLimitOrReject(ip, RATE_LIMITS.aiScrape, res)) return;

  try {
    const { url } = req.body as { url: string };

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required', code: 'BAD_REQUEST' });
    }

    // Validate URL format
    let parsed: URL;
    try {
      parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return res.status(400).json({ error: 'URL must use HTTP or HTTPS', code: 'BAD_REQUEST' });
      }
    } catch {
      return res.status(400).json({ error: 'Invalid URL format', code: 'BAD_REQUEST' });
    }

    // SSRF protection: block private/internal hostnames
    if (isPrivateHostname(parsed.hostname)) {
      return res.status(400).json({ error: 'URL not allowed', code: 'BAD_REQUEST' });
    }

    // Fetch the URL content
    let htmlContent: string;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CommonsJobs/1.0)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      clearTimeout(timer);

      if (!response.ok) {
        return res.status(200).json({
          result: {},
          fallback: true,
        });
      }

      htmlContent = await response.text();
    } catch {
      return res.status(200).json({
        result: {},
        fallback: true,
      });
    }

    // Extract job data using AI
    const result = await scrapeAndExtract(htmlContent);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(200).json({
      result: {},
      fallback: true,
    });
  }
}
