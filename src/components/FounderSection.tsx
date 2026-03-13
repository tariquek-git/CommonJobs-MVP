import { useLocalStorage } from '../hooks/useLocalStorage';
import { FOUNDER_TEXT } from '../lib/constants';

export default function FounderSection() {
  const [collapsed, setCollapsed] = useLocalStorage('founder-collapsed', false);

  return (
    <div className="space-y-4">
      {/* Collapsible founder message — first */}
      <div className="surface-elevated overflow-hidden">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-navy-800/50 transition-colors"
          aria-expanded={!collapsed}
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Why I built Commons Jobs
          </span>
          <svg
            className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
              collapsed ? '' : 'rotate-180'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {!collapsed && (
          <div className="px-5 pb-5 border-t border-gray-100 dark:border-navy-700/30">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line mt-4">
              {FOUNDER_TEXT}
            </p>
          </div>
        )}
      </div>

      {/* How it works — human-over-automation theme */}
      <div className="surface-elevated p-5 sm:p-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-5 flex items-center gap-2">
          <svg className="h-4 w-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          How it works
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Step 1 */}
          <div className="relative flex sm:flex-col items-start gap-3 sm:items-center sm:text-center">
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="sm:mt-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">A real person posts a role</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
                No bots, no scrapers, no algorithms. A human submitted this because they thought it was worth sharing.
              </p>
            </div>
            <div className="hidden sm:block absolute -right-3 top-5 text-gray-300 dark:text-navy-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex sm:flex-col items-start gap-3 sm:items-center sm:text-center">
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="sm:mt-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Human-reviewed, not algorithm-sorted</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
                Every listing is read by a person and translated from corporate-speak into plain language. No filters, no AI ranking.
              </p>
            </div>
            <div className="hidden sm:block absolute -right-3 top-5 text-gray-300 dark:text-navy-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex sm:flex-col items-start gap-3 sm:items-center sm:text-center">
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="sm:mt-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Apply direct, or ask for a warm intro</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
                Apply on your own, or ask for a warm intro and we'll try to get it in front of the right person.
              </p>
            </div>
          </div>
        </div>

        {/* Human trust note */}
        <div className="mt-5 rounded-lg bg-accent-50/50 dark:bg-accent-900/10 border border-accent-200/40 dark:border-accent-800/20 px-4 py-3 flex items-start gap-2.5">
          <svg className="h-4 w-4 text-accent-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <p className="text-xs text-accent-700 dark:text-accent-400 leading-relaxed">
            <span className="font-semibold">Humans, not automation.</span> Where most job boards use technology to replace trust, we use people. Job posters commit to engaging with warm intros. Candidates commit to being genuine. Every connection goes through a real person — not a matching algorithm.
          </p>
        </div>
      </div>

      {/* Pre-alpha note */}
      <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 px-4 py-3">
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          <span className="font-semibold">Please note:</span>{' '}
          This is pre-alpha. Things may break, look weird, or change drastically. You're seeing it early because your feedback matters more than polish right now.
        </p>
      </div>
    </div>
  );
}
