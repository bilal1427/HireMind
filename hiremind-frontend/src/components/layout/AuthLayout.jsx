import { Outlet, Link } from 'react-router-dom';
import { Sparkles, Brain, Target, ArrowLeft } from 'lucide-react';

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Matching', desc: 'Get smart match scores based on your skills and experience.' },
  { icon: Target, title: 'Personalized Insights', desc: 'Know exactly where you stand and how to improve.' },
  { icon: Sparkles, title: 'Career Guidance', desc: 'Let AI guide your next career move with confidence.' },
];

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-brand-300 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full w-full p-12 xl:p-16">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">HireMind</h1>
              <p className="text-sm text-white/70">AI Talent Platform</p>
            </div>
          </Link>

          <div className="space-y-10 my-auto">
            <div className="space-y-4 max-w-md">
              <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
                Find your perfect <span className="text-brand-200">career match</span> with AI
              </h2>
              <p className="text-lg text-white/80 leading-relaxed">
                Smart matching, personalized insights, and guided career pathways — powered by advanced AI that actually understands your talent.
              </p>
            </div>

            <div className="space-y-5 max-w-md">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-5.5 h-5.5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{f.title}</h3>
                    <p className="text-sm text-white/70 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} HireMind AI. All rights reserved.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        <div className="lg:hidden flex items-center justify-between px-5 h-16 border-b border-surface-200 dark:border-surface-800">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <span className="font-bold text-lg text-surface-900 dark:text-white">HireMind</span>
          </Link>
          <Link
            to="/"
            className="btn-ghost !px-3 text-xs gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-8 lg:px-16">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
