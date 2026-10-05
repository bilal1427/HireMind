import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-950 px-5 py-16">
      <div className="text-center max-w-lg mx-auto animate-fade-in space-y-8">
        <div className="relative inline-block">
          <div className="text-[9rem] sm:text-[12rem] font-black leading-none tracking-tighter bg-gradient-to-br from-brand-500 via-brand-600 to-emerald-500 bg-clip-text text-transparent select-none">
            404
          </div>
          <div className="absolute inset-0 -z-10 blur-3xl opacity-30">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-emerald-500 rounded-full scale-75" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white tracking-tight">
            Page not found
          </h1>
          <p className="text-base text-surface-600 dark:text-surface-400 leading-relaxed">
            Looks like you wandered off the path. The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 p-5 flex items-start gap-3 max-w-sm mx-auto text-left">
          <Search className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-surface-900 dark:text-white mb-0.5">
              Quick tips
            </p>
            <ul className="text-xs text-surface-600 dark:text-surface-400 space-y-1 list-disc list-inside">
              <li>Double-check the URL for typos</li>
              <li>Go back to the previous page</li>
              <li>Head home to explore</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 h-11 shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            Back to home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300 text-sm font-semibold px-5 h-11 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
