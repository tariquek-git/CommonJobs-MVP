import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_NAME } from '../lib/constants';
import AboutModal from './AboutModal';

export default function Header() {
  const location = useLocation();
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-navy-700/40 bg-white/80 dark:bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 font-bold text-white text-sm shadow-sm shadow-accent-500/20">
              FC
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors leading-tight">
                {APP_NAME}
              </span>
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 tracking-wider uppercase leading-tight hidden sm:block">
                Jobs — Fintech & Banking
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              to="/"
              className={`btn-ghost ${location.pathname === '/' ? 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-navy-800' : ''}`}
            >
              Jobs
            </Link>
            <button
              onClick={() => setShowAbout(true)}
              className="btn-ghost flex items-center gap-1.5"
              title="About Tarique"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/30 text-[10px] font-bold text-accent-600 dark:text-accent-400">
                TK
              </div>
              <span className="hidden sm:inline text-sm">About</span>
            </button>
            <Link
              to="/submit"
              className="btn-primary text-sm"
            >
              <svg className="h-4 w-4 mr-1.5 -ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Submit a Role
            </Link>
          </nav>
        </div>
      </header>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  );
}
