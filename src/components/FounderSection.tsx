import { useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useInView } from '../hooks/useInView';
import { FOUNDER_TEXT } from '../lib/constants';
import { Link } from 'react-router-dom';

export default function FounderSection() {
  const [collapsed, setCollapsed] = useLocalStorage('founder-collapsed', true);
  const [detailsOpen, setDetailsOpen] = useLocalStorage('how-it-works-details', false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { ref: stepsRef, inView: stepsVisible } = useInView();

  return (
    <div className="space-y-4">
      {/* Collapsible founder message */}
      <div className="surface-elevated overflow-hidden">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          aria-expanded={!collapsed}
        >
          <span className="text-sm font-semibold text-gray-700">
            Why I built Fintech Commons
          </span>
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
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
        <div
          ref={contentRef}
          className={`overflow-hidden transition-all duration-300 ease-out ${
            collapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
          }`}
        >
          <div className="px-5 pb-5 border-t border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mt-4">
              {FOUNDER_TEXT}
            </p>
          </div>
        </div>
      </div>

      {/* ── How It Works — visual pipeline ── */}
      <div ref={stepsRef} className="surface-elevated overflow-hidden">
        {/* Horizontal step flow */}
        <div className="px-5 sm:px-8 py-6 sm:py-8">
          <div className="flex items-start justify-between sm:justify-center sm:gap-0">
            {/* Step 1 */}
            <div
              className={`flex flex-col items-center text-center flex-1 transition-all duration-500 ${
                stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '0ms' }}
            >
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
                <svg className="h-7 w-7 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-900">Post</p>
              <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Real people, real roles</p>
            </div>

            {/* Connector */}
            <div className={`flex items-center pt-7 sm:pt-8 px-1 sm:px-2 transition-all duration-500 ${stepsVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '100ms' }}>
              <div className="w-6 sm:w-10 h-px bg-gradient-to-r from-indigo-300 to-emerald-300" />
              <svg className="h-3 w-3 text-emerald-400 -ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 4.5L21 12l-7.5 7.5" /></svg>
            </div>

            {/* Step 2 */}
            <div
              className={`flex flex-col items-center text-center flex-1 transition-all duration-500 ${
                stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '150ms' }}
            >
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
                <svg className="h-7 w-7 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-900">Review</p>
              <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Human-vetted, no bots</p>
            </div>

            {/* Connector */}
            <div className={`flex items-center pt-7 sm:pt-8 px-1 sm:px-2 transition-all duration-500 ${stepsVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '250ms' }}>
              <div className="w-6 sm:w-10 h-px bg-gradient-to-r from-emerald-300 to-amber-300" />
              <svg className="h-3 w-3 text-amber-400 -ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 4.5L21 12l-7.5 7.5" /></svg>
            </div>

            {/* Step 3 */}
            <div
              className={`flex flex-col items-center text-center flex-1 transition-all duration-500 ${
                stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '300ms' }}
            >
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3">
                <svg className="h-7 w-7 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-900">Humanize</p>
              <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">AI cuts the corporate speak</p>
            </div>

            {/* Connector */}
            <div className={`flex items-center pt-7 sm:pt-8 px-1 sm:px-2 transition-all duration-500 ${stepsVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '400ms' }}>
              <div className="w-6 sm:w-10 h-px bg-gradient-to-r from-amber-300 to-sky-300" />
              <svg className="h-3 w-3 text-sky-400 -ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 4.5L21 12l-7.5 7.5" /></svg>
            </div>

            {/* Step 4 */}
            <div
              className={`flex flex-col items-center text-center flex-1 transition-all duration-500 ${
                stepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '450ms' }}
            >
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/20 mb-3">
                <svg className="h-7 w-7 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-900">Connect</p>
              <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Apply or warm intro</p>
            </div>
          </div>
        </div>

        {/* Expandable detail section */}
        <div className="border-t border-gray-100">
          <button
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="w-full flex items-center justify-between px-5 sm:px-8 py-3 text-left hover:bg-gray-50 transition-colors"
            aria-expanded={detailsOpen}
          >
            <span className="text-xs font-semibold text-gray-500">How it actually works</span>
            <svg
              className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-300 ${detailsOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ease-out ${detailsOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-5 sm:px-8 pb-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-indigo-50/50 border border-indigo-100 p-3">
                  <p className="text-xs font-semibold text-indigo-700 mb-1">For posters</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Paste a job URL or description. AI rewrites the corporate speak into real talk — what someone in the role would actually care about. You review and edit before submitting.
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-3">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">For candidates</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Browse real roles, humanized. Apply directly or request a warm intro — I'll pass your info to the poster. They decide if they want to connect. No pressure on either side.
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-200/60 p-3">
                <p className="text-xs font-semibold text-gray-700 mb-1">The warm intro promise</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Candidates won't know if you respond or not. All I ask is that if you see potential, give them a real look. And if you can help regardless — even just a pointer or referral — please do. That's what makes this different from every other job board.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="bg-gray-50 border-t border-gray-100 px-5 sm:px-8 py-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Automation does the plumbing. The trust stays human.
          </p>
          <Link to="/submit" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1">
            Submit a role
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
