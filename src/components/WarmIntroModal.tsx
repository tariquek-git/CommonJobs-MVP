import { useState, useRef, useEffect } from 'react';
import { requestWarmIntro } from '../lib/api';
import type { Job } from '../lib/types';

interface WarmIntroModalProps {
  job: Job;
  onClose: () => void;
}

export default function WarmIntroModal({ job, onClose }: WarmIntroModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await requestWarmIntro({
        job_id: job.id,
        name: name.trim(),
        email: email.trim(),
        linkedin: linkedin.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4 animate-fade-in"
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      >
        <div className="w-full max-w-md glass-panel p-8 text-center animate-scale-in">
          {/* Success checkmark */}
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 mb-4">
            <svg className="h-7 w-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">You're on my radar</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            I'll personally reach out to the hiring contact at <span className="font-medium text-gray-800 dark:text-gray-200">{job.company}</span> about you.
            If there's a connection, you'll hear from me via email.
          </p>

          {/* Honest note */}
          <div className="mt-4 rounded-lg bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/20 p-3">
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              <span className="font-semibold">Real talk:</span> Not every intro leads to a reply.
              Hiring timelines shift, roles get filled, people get busy. That's not on you.
              I'll do my part — the rest is out of both our hands.
            </p>
          </div>

          <button onClick={onClose} className="btn-primary mt-6">Got it, thanks</button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm px-4 animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-md glass-panel p-0 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-navy-700/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-50 dark:bg-accent-900/20">
                <svg className="h-5 w-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Warm Intro</h3>
            </div>
            <button onClick={onClose} className="btn-ghost p-2 -mr-2" aria-label="Close">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 ml-[46px]">
            for <span className="font-medium text-gray-700 dark:text-gray-300">{job.title}</span> at {job.company}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* How it works callout */}
          <div className="rounded-xl bg-accent-50/60 dark:bg-accent-900/10 border border-accent-200/60 dark:border-accent-800/20 p-4">
            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700 dark:text-accent-400 mb-1">
                  I'd love to get your info in front of the right person
                </p>
                <p className="text-xs text-accent-600/80 dark:text-accent-400/70 leading-relaxed">
                  This isn't automated. I personally review each request and reach out to the job poster on your behalf. A real intro from a real person — that's the whole point.
                </p>
              </div>
            </div>
          </div>

          {/* Two-sided trust callout */}
          <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/20 p-4">
            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  <span className="font-semibold">Scout's honour — both sides:</span> The person who posted this role opted in to warm intros and committed to engaging in good faith when someone's info comes their way. In return, we ask that you're genuine too — real interest, real profile, real intent.
                </p>
              </div>
            </div>
          </div>

          {/* Honest expectations callout */}
          <div className="rounded-xl bg-gray-50 dark:bg-navy-900/40 border border-gray-200/60 dark:border-navy-700/30 p-4">
            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  <span className="font-semibold">Heads up —</span> warm intros don't always lead to warm responses.
                  Hiring is messy. People are busy. Roles change.
                  But having a real person put your name forward? That's still more than a cold apply gets you.
                </p>
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Your Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Jane Doe"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Your Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@email.com"
              />
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">So I can follow up with you. Never shared with anyone.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                LinkedIn
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5 font-normal">optional, but helps</span>
              </label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="input-field"
                placeholder="linkedin.com/in/yourprofile"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200/60 dark:border-red-800/20 p-3 flex items-center gap-2">
              <svg className="h-4 w-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-navy-700/40 bg-gray-50/50 dark:bg-navy-900/20">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Scout's honour — I'll get this in front of the right person.
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !name.trim() || !email.trim()}
              className="btn-primary text-sm disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  Send My Info
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
