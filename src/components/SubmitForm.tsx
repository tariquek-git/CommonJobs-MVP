import { useState, useRef } from 'react';
import { submitJob, scrapeUrl, humanizeJob } from '../lib/api';
import type { SubmissionPayload } from '../lib/types';
import { useToast } from './Toast';
import { usePostHog } from '@posthog/react';

export default function SubmitForm() {
  const { toast } = useToast();
  const posthog = usePostHog();
  const formSectionRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<SubmissionPayload>({
    title: '',
    company: '',
    location: '',
    country: '',
    description: '',
    summary: '',
    apply_url: '',
    company_url: '',
    tags: [],
    submitter_name: '',
    submitter_email: '',
    standout_perks: [],
    warm_intro_ok: true,
  });
  const [perkInput, setPerkInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [humanizing, setHumanizing] = useState(false);
  const [result, setResult] = useState<{ ref: string; message: string } | null>(null);
  const [aiFallback, setAiFallback] = useState(false);
  const [scrapeFailed, setScrapeFailed] = useState(false);
  const [website, setWebsite] = useState('');

  const updateField = (field: keyof SubmissionPayload, value: string | string[] | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleScrapeUrl = async () => {
    if (!form.apply_url) return;
    setScraping(true);
    setScrapeFailed(false);
    try {
      const res = await scrapeUrl(form.apply_url);
      if (res.fallback) {
        setScrapeFailed(true);
        toast('Could not auto-fill. Please enter details manually.', 'info');
      } else if (res.result) {
        const data = res.result;
        setForm((prev) => ({
          ...prev,
          title: data.title || prev.title,
          company: data.company || prev.company,
          description: data.description || prev.description,
          location: data.location || prev.location,
        }));
        toast('Auto-filled from URL!', 'success');
      }
    } catch {
      setScrapeFailed(true);
      toast('Could not auto-fill from URL. Please enter details manually.', 'error');
    } finally {
      setScraping(false);
    }
  };

  const handleHumanize = async () => {
    if (!form.description || !form.title) return;
    setHumanizing(true);
    setAiFallback(false);
    posthog?.capture('job_submission_ai_humanize_used', {
      job_title: form.title,
      company: form.company,
    });
    try {
      const res = await humanizeJob(form.description, form.title);
      if (res.fallback || !res.result.humanized_description) {
        setAiFallback(true);
        toast('AI unavailable. You can still edit and submit manually.', 'info');
      } else {
        updateField('summary', res.result.humanized_description);
        if (res.result.standout_perks.length > 0) {
          updateField('standout_perks', res.result.standout_perks);
        }
        toast('Job post humanized!', 'success');
      }
    } catch (err) {
      posthog?.captureException(err instanceof Error ? err : new Error(String(err)));
      setAiFallback(true);
      toast('AI humanizer unavailable', 'error');
    } finally {
      setHumanizing(false);
    }
  };

  const handleAddPerk = () => {
    const perk = perkInput.trim();
    if (perk && (!form.standout_perks || form.standout_perks.length < 10) && !form.standout_perks?.includes(perk)) {
      setForm((prev) => ({ ...prev, standout_perks: [...(prev.standout_perks || []), perk] }));
      setPerkInput('');
    }
  };

  const handleRemovePerk = (perk: string) => {
    setForm((prev) => ({ ...prev, standout_perks: prev.standout_perks?.filter((p) => p !== perk) }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: SubmissionPayload & { website?: string } = { ...form, website };
      const res = await submitJob(payload);
      posthog?.capture('job_submitted', {
        job_title: form.title,
        company: form.company,
        location: form.location,
        has_warm_intro: form.warm_intro_ok,
        has_ai_summary: !!form.summary,
        standout_perks_count: form.standout_perks?.length ?? 0,
        submission_ref: res.submission_ref,
      });
      setResult({ ref: res.submission_ref, message: res.message });
      toast('Submission successful!', 'success');
    } catch (err) {
      posthog?.captureException(err instanceof Error ? err : new Error(String(err)));
      toast(err instanceof Error ? err.message : 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success Screen ──
  if (result) {
    return (
      <div className="surface-elevated p-8 text-center max-w-lg mx-auto animate-scale-in">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-50 mb-4">
          <svg className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">You're in the queue</h2>
        <p className="text-gray-600 text-sm mb-1">{result.message}</p>
        <p className="text-gray-600 text-xs mb-4">I'll personally review this and get it live as soon as I can. No bots here.</p>
        <div className="surface-tinted p-4 inline-block rounded-xl">
          <p className="text-xs text-gray-600 mb-1">Reference ID</p>
          <p className="text-lg font-mono font-bold text-indigo-600">{result.ref}</p>
        </div>
        <button
          onClick={() => {
            setResult(null);
            setForm({
              title: '', company: '', location: '', country: '',
              description: '', summary: '', apply_url: '', company_url: '',
              tags: [], submitter_name: '', submitter_email: '', standout_perks: [],
              warm_intro_ok: true,
            });
          }}
          className="btn-secondary mt-6 block mx-auto"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10">

      {/* ━━━ Section 1: How It Works ━━━ */}
      <section className="surface-elevated p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">How Fintech Commons works</h2>
        <p className="text-sm text-gray-600 mb-6">
          This isn't a job board where listings disappear into the void. Here's what makes it different.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="text-center sm:text-left">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 mb-3">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">You submit</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Paste the job URL and description. AI translates the corporate-speak into real talk.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center sm:text-left">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 mb-3">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">I review it</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Every submission is personally reviewed. No spam, no ghost listings. If it's on the board, it's real.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center sm:text-left">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 mb-3">
              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Candidates connect</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              People can request a warm intro through you. You decide if you want to help — zero pressure.
            </p>
          </div>
        </div>
      </section>

      {/* ━━━ Section 2: Warm Intro Disclaimer ━━━ */}
      <section className="rounded-xl bg-indigo-50/50 border border-indigo-200/40 p-5 sm:p-6">
        <div className="flex gap-3">
          <div className="shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-indigo-800 mb-1">About warm intros</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              When someone sees a role you've posted, they can request a warm intro through me. I'll share their info with you — name, LinkedIn, and a short message about why they're interested.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed mt-2">
              <span className="font-medium">The candidate doesn't know if you respond or not.</span> There's no pressure — if the fit isn't right, no worries. All I ask is that if you see potential, give them a real look. And if you think you can help regardless — even just a pointer or referral — please do.
            </p>
          </div>
        </div>
      </section>

      {aiFallback && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3" role="alert">
          <p className="text-xs text-amber-700">
            AI features are temporarily unavailable. You can still edit and submit manually.
          </p>
        </div>
      )}

      {/* ━━━ Section 3: Job URL & Raw Description ━━━ */}
      <section className="surface-elevated p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Paste the job</h2>
          <p className="text-sm text-gray-600">
            Drop the job URL and/or copy-paste the full description. Add anything else you think candidates should know — context only the poster or someone close to the role would have.
          </p>
        </div>

        {/* URL + auto-fill */}
        <div>
          <label htmlFor="submit-apply-url" className="block text-sm font-medium text-gray-700 mb-1.5">Job URL</label>
          <div className="flex gap-2">
            <input
              id="submit-apply-url"
              type="url"
              value={form.apply_url}
              onChange={(e) => updateField('apply_url', e.target.value)}
              placeholder="https://company.com/careers/role"
              className="input-field flex-1"
            />
            <button
              type="button"
              onClick={handleScrapeUrl}
              disabled={!form.apply_url || scraping}
              className="btn-secondary shrink-0 disabled:opacity-40"
              aria-busy={scraping}
            >
              {scraping ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : 'Auto-fill'}
            </button>
          </div>
          {scrapeFailed && (
            <p className="text-xs text-amber-600 mt-1" role="alert">Could not scrape — fill in manually below.</p>
          )}
        </div>

        {/* Full job description */}
        <div>
          <label htmlFor="submit-description" className="block text-sm font-medium text-gray-700 mb-1.5">Full Job Description</label>
          <textarea
            id="submit-description"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={10}
            className="input-field resize-y"
            placeholder="Paste the full job description here — corporate speak is welcome, that's what the AI is for..."
          />
        </div>
      </section>

      {/* ━━━ Section 4: Humanize with AI ━━━ */}
      <section className="surface-elevated p-6 sm:p-8 space-y-5" ref={formSectionRef}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Humanize with AI</h2>
            <p className="text-sm text-gray-600">
              Translates corporate jargon into plain language. Auto-fills the fields below.
            </p>
          </div>
          <button
            type="button"
            onClick={handleHumanize}
            disabled={!form.description || !form.title || humanizing}
            className="btn-primary shrink-0 disabled:opacity-40"
            aria-busy={humanizing}
          >
            {humanizing ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Humanizing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Humanize with AI
              </>
            )}
          </button>
        </div>

        <div className="rounded-lg bg-gray-50 border border-gray-200/60 px-3 py-2">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-medium text-gray-600">Claude</span> (Anthropic). AI is human too and makes mistakes — please review and edit the generated content below before submitting.
          </p>
        </div>
      </section>

      {/* ━━━ Section 5: Auto-filled Job Details ━━━ */}
      <section className="surface-elevated p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Job details</h2>
          <p className="text-sm text-gray-600">
            These fields are auto-filled from the URL and AI. Review and correct anything that's off.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="submit-title" className="block text-sm font-medium text-gray-700 mb-1.5">
              Job Title <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input id="submit-title" type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)} className="input-field" placeholder="Senior Software Engineer" required aria-required="true" />
          </div>
          <div>
            <label htmlFor="submit-company" className="block text-sm font-medium text-gray-700 mb-1.5">
              Company <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input id="submit-company" type="text" value={form.company} onChange={(e) => updateField('company', e.target.value)} className="input-field" placeholder="Stripe" required aria-required="true" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="submit-location" className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
            <input id="submit-location" type="text" value={form.location} onChange={(e) => updateField('location', e.target.value)} className="input-field" placeholder="Toronto, ON" />
          </div>
          <div>
            <label htmlFor="submit-country" className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
            <input id="submit-country" type="text" value={form.country} onChange={(e) => updateField('country', e.target.value)} className="input-field" placeholder="Canada" />
          </div>
        </div>

        <div>
          <label htmlFor="submit-company-url" className="block text-sm font-medium text-gray-700 mb-1.5">Company Website</label>
          <input id="submit-company-url" type="url" value={form.company_url} onChange={(e) => updateField('company_url', e.target.value)} className="input-field" placeholder="https://company.com" />
        </div>
      </section>

      {/* ━━━ Section 6: Humanized Description ━━━ */}
      <section className="surface-elevated p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">The real talk</h2>
          <p className="text-sm text-gray-600">
            This is the version candidates actually see. Write it like you're explaining the role to a friend — what would a data engineer, accountant, or sales rep actually care about? What's the day-to-day like? What's the company culture <em>really</em> like? Go beyond the generic corporate speak.
          </p>
        </div>

        <div>
          <label htmlFor="submit-summary" className="block text-sm font-medium text-gray-700 mb-1.5">Humanized Description</label>
          <textarea
            id="submit-summary"
            value={form.summary}
            onChange={(e) => updateField('summary', e.target.value)}
            rows={6}
            className="input-field resize-y"
            placeholder="Click 'Humanize with AI' above to auto-generate, or write your own plain-language description..."
          />
        </div>
      </section>

      {/* ━━━ Section 7: Standout Perks ━━━ */}
      <section className="surface-elevated p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Standout perks</h2>
          <p className="text-sm text-gray-600">
            Skip the basics everyone offers (health, dental, 401k, PTO, sick days). What <em>actually</em> makes this company different? Think: 4-day work week, equity for all, remote-first, learning budgets, sabbaticals, home office stipend.
          </p>
        </div>

        {form.standout_perks && form.standout_perks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.standout_perks.map((perk) => (
              <span key={perk} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs text-indigo-700">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                {perk}
                <button type="button" onClick={() => handleRemovePerk(perk)} className="text-indigo-400 hover:text-red-500 ml-0.5" aria-label={`Remove ${perk}`}>&times;</button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            id="submit-perk-input"
            type="text"
            value={perkInput}
            onChange={(e) => setPerkInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPerk(); } }}
            className="input-field flex-1"
            placeholder="e.g., 4-day work week, equity, remote-first"
          />
          <button type="button" onClick={handleAddPerk} className="btn-secondary shrink-0">Add</button>
        </div>
      </section>

      {/* ━━━ Section 8: Warm Intro + About You ━━━ */}
      <section className="surface-elevated p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Almost there</h2>
          <p className="text-sm text-gray-600">
            A bit about you so I can notify you when it's live and connect warm intro candidates.
          </p>
        </div>

        {/* Warm intro toggle */}
        <div className="rounded-xl bg-indigo-50/50 border border-indigo-200/40 p-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.warm_intro_ok}
              aria-label="Allow warm intros for this role"
              onClick={() => updateField('warm_intro_ok', !form.warm_intro_ok)}
              className={`shrink-0 mt-0.5 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-2 ${
                form.warm_intro_ok ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                form.warm_intro_ok ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <div>
              <p className="text-sm font-medium text-gray-900">Allow warm intros for this role</p>
              <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                Candidates can request a warm intro through me. I'll send you their info so you can connect directly. Never shared publicly.
              </p>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="submit-your-name" className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
            <input id="submit-your-name" type="text" value={form.submitter_name || ''} onChange={(e) => updateField('submitter_name', e.target.value)} className="input-field" placeholder="Jane Doe" />
          </div>
          <div>
            <label htmlFor="submit-your-email" className="block text-sm font-medium text-gray-700 mb-1.5">Your Email</label>
            <input id="submit-your-email" type="email" value={form.submitter_email} onChange={(e) => updateField('submitter_email', e.target.value)} className="input-field" placeholder="you@email.com" />
          </div>
        </div>

        {/* Honeypot */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" type="text" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
        </div>
      </section>

      {/* ━━━ Preview Card ━━━ */}
      {(form.title || form.company || form.summary) && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Preview — how candidates will see it</p>
          <div className="surface-elevated p-5 relative overflow-hidden">
            <h4 className="font-semibold text-gray-900">{form.title || 'Untitled'}</h4>
            <p className="text-sm text-gray-600 mt-0.5">{form.company || 'No company'}</p>
            {form.location && <p className="text-xs text-gray-600 mt-1">{form.location}{form.country ? `, ${form.country}` : ''}</p>}
            {form.summary && <p className="text-sm text-gray-600 leading-relaxed mt-2 line-clamp-3">{form.summary}</p>}
            {form.standout_perks && form.standout_perks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.standout_perks.slice(0, 3).map((perk) => (
                  <span key={perk} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs text-indigo-700">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    {perk}
                  </span>
                ))}
                {form.standout_perks.length > 3 && (
                  <span className="text-xs text-gray-600">+{form.standout_perks.length - 3} more</span>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ━━━ Submit Button ━━━ */}
      <div className="flex justify-center pb-8">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !form.title || !form.company}
          className="btn-primary px-8 py-3 text-base disabled:opacity-40"
          aria-busy={submitting}
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </>
          ) : (
            <>
              Submit for Review
              <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
