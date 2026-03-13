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
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent-50 dark:bg-accent-900/20 mb-4">
            <svg className="h-7 w-7 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Request Sent!</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            I'll personally reach out to the job poster about you. You'll hear from me via email if there's a connection.
          </p>
          <button onClick={onClose} className="btn-primary mt-6">Got it</button>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request a Warm Intro</h3>
            <button onClick={onClose} className="btn-ghost p-2 -mr-2" aria-label="Close">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            for <span className="font-medium text-gray-700 dark:text-gray-300">{job.title}</span> at {job.company}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="rounded-lg bg-accent-50/60 dark:bg-accent-900/10 border border-accent-100 dark:border-accent-800/20 p-3">
            <p className="text-xs text-accent-700 dark:text-accent-400 leading-relaxed">
              To keep this working for everyone, I personally review each request and send it to the job poster. This isn't automated — it's a real intro from a real person.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Your Name <span className="text-red-500">*</span>
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
              Your Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">LinkedIn Profile</label>
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              className="input-field"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-navy-700/40">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !email.trim()}
            className="btn-primary disabled:opacity-40"
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
              'Send Request'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
