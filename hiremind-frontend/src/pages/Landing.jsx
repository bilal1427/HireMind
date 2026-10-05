import { Link } from 'react-router-dom';
import {
  Sparkles,
  Brain,
  Target,
  Zap,
  Shield,
  BarChart3,
  MessageSquare,
  ArrowRight,
  Check,
  Star,
  Menu,
  Moon,
  Sun,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '../lib/utils';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Match Scoring',
    description: 'Get accurate match percentages based on skills, experience, and cultural fit.',
    color: 'brand',
  },
  {
    icon: Target,
    title: 'Skill Gap Analysis',
    description: 'Identify exactly what skills you need to land your dream role.',
    color: 'emerald',
  },
  {
    icon: BarChart3,
    title: 'Data-Driven Insights',
    description: 'Salary benchmarks, market trends, and personalized career recommendations.',
    color: 'blue',
  },
  {
    icon: MessageSquare,
    title: '24/7 AI Assistant',
    description: 'Chat with HireMind AI for real-time guidance on every step of your journey.',
    color: 'amber',
  },
  {
    icon: Zap,
    title: 'Instant Feedback',
    description: 'AI review of your resume, cover letters, and interview prep in seconds.',
    color: 'orange',
  },
  {
    icon: Shield,
    title: 'Smart Matching',
    description: 'Recruiters find top candidates 10x faster with intelligent screening.',
    color: 'green',
  },
];

const PRICING = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    desc: 'Perfect for getting started',
    highlight: false,
    features: [
      '5 job matches per day',
      'Basic AI insights',
      'Single profile & resume',
      'Community support',
    ],
    cta: 'Get started',
  },
  {
    name: 'Professional',
    price: '$19',
    period: '/mo',
    desc: 'For serious job seekers',
    highlight: true,
    features: [
      'Unlimited job matches',
      'Advanced AI analysis',
      'Skill gap roadmap',
      'AI resume optimization',
      'Priority AI chat support',
      'Interview coaching AI',
    ],
    cta: 'Start 7-day trial',
  },
  {
    name: 'Recruiter',
    price: '$49',
    period: '/mo',
    desc: 'For hiring teams',
    highlight: false,
    features: [
      'Unlimited job postings',
      'AI candidate ranking',
      'Bulk outreach tools',
      'Team collaboration',
      'ATS integrations',
      'Dedicated success manager',
    ],
    cta: 'Contact sales',
  },
];

const TESTIMONIALS = [
  {
    quote: "HireMind's match score helped me land a 30% higher salary than my last role. The AI insights were spot on about what companies were looking for.",
    name: 'Jamie Rivera',
    role: 'Senior Software Engineer',
    avatar: 'JR',
  },
  {
    quote: 'As a recruiter, I cut my screening time by 80%. The AI matching brings me qualified candidates I would have missed otherwise.',
    name: 'Marcus Chen',
    role: 'Head of Talent, TechCorp',
    avatar: 'MC',
  },
  {
    quote: 'The skill gap analysis told me exactly what to learn. Three months later, I had the promotion I was gunning for.',
    name: 'Priya Natarajan',
    role: 'Product Designer',
    avatar: 'PN',
  },
];

const COLOR_MAP = {
  brand: 'from-brand-500 to-brand-700',
  emerald: 'from-emerald-500 to-emerald-700',
  blue: 'from-blue-500 to-blue-700',
  amber: 'from-amber-500 to-amber-600',
  orange: 'from-orange-500 to-orange-700',
  green: 'from-green-500 to-green-700',
};

const COLOR_SOFT = {
  brand: 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
  blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
  orange: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
  green: 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400',
};

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 text-surface-900 dark:text-white flex flex-col">
      <header className="sticky top-0 z-40 border-b border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-950/80 backdrop-blur-lg">
        <div className="container-app h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">HireMind</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            <a href="#features" className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Testimonials</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            <Link to="/login" className="hidden sm:inline-flex btn-ghost !px-4 text-sm">Sign in</Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 h-9 shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98]"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setMobileMenu((v) => !v)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t border-surface-200 dark:border-surface-800 px-5 py-3 space-y-2 animate-slide-down">
            <a href="#features" onClick={() => setMobileMenu(false)} className="block px-3 py-2 text-sm font-medium rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">Features</a>
            <a href="#pricing" onClick={() => setMobileMenu(false)} className="block px-3 py-2 text-sm font-medium rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">Pricing</a>
            <a href="#testimonials" onClick={() => setMobileMenu(false)} className="block px-3 py-2 text-sm font-medium rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">Testimonials</a>
            <Link to="/login" onClick={() => setMobileMenu(false)} className="block px-3 py-2 text-sm font-medium rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">Sign in</Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70rem] h-[40rem] bg-gradient-to-br from-brand-500/20 via-brand-400/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container-app text-center max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                AI-powered talent matching, reimagined
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05] animate-slide-up">
              The smartest way to
              <span className="block mt-2 bg-gradient-to-r from-brand-500 via-brand-600 to-emerald-500 bg-clip-text text-transparent">
                find your perfect fit.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.08s' }}>
              HireMind uses cutting-edge AI to match candidates and employers on skills, experience, and potential — not just keywords. Land your next role or hire your next star, faster.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 animate-slide-up" style={{ animationDelay: '0.16s' }}>
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-base font-semibold px-6 h-12 shadow-xl shadow-brand-500/25 transition-all active:scale-[0.98]"
              >
                Start free trial
                <ArrowRight className="w-4.5 h-4.5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300 text-base font-semibold px-6 h-12 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              >
                I'm hiring
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-6 text-sm text-surface-500 dark:text-surface-400 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {['No credit card', '7-day pro trial', 'Cancel anytime'].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">{t}</span>
                </div>
              ))}
            </div>

            <div className="relative mx-auto mt-12 max-w-5xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-elevated overflow-hidden">
                <div className="h-9 border-b border-surface-200 dark:border-surface-800 flex items-center gap-1.5 px-4 bg-surface-50 dark:bg-surface-800/50">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-auto text-xs text-surface-400">app.hiremind.ai</span>
                </div>
                <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card-base !border-none !shadow-none p-5 bg-surface-50 dark:bg-surface-800/50">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">Match Score</p>
                    <div className="flex items-end gap-4">
                      <div className="relative w-24 h-24">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="44" fill="none" className="text-surface-200 dark:text-surface-700" stroke="currentColor" strokeWidth="8" />
                          <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" className="text-emerald-500" strokeWidth="8" strokeLinecap="round" strokeDasharray={276.5} strokeDashoffset={33} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-emerald-600 dark:text-emerald-400">88%</div>
                      </div>
                      <div>
                        <p className="font-bold text-lg">Senior React Engineer</p>
                        <p className="text-xs text-surface-500">TechCorp Industries · Remote</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {[['Skills', 92, 'bg-emerald-500'], ['Experience', 81, 'bg-green-500'], ['Culture', 85, 'bg-brand-500']].map(([l, v, c]) => (
                        <div key={l}>
                          <div className="flex justify-between text-xs mb-1"><span className="font-medium">{l}</span><span className="font-bold">{v}%</span></div>
                          <div className="h-1.5 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden"><div className={`h-full ${c} rounded-full`} style={{ width: `${v}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card-base !border-none !shadow-none p-5 bg-surface-50 dark:bg-surface-800/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      </div>
                      <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 uppercase tracking-wider">AI Recommendation</p>
                    </div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">Apply today — you're in the top 5% of candidates</p>
                    <p className="text-xs leading-relaxed text-surface-600 dark:text-surface-400">
                      Your React + Node.js experience aligns perfectly with their stack. 92% of candidates with your profile get interviews at TechCorp.
                    </p>
                    <button className="w-full h-9 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors">
                      Apply with AI resume →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 sm:py-28 bg-surface-50 dark:bg-surface-900/50 border-y border-surface-200 dark:border-surface-800">
          <div className="container-app">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-3">Why HireMind</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">AI that actually <span className="text-brand-600 dark:text-brand-400">gets</span> talent</h2>
              <p className="text-surface-600 dark:text-surface-400">Everything you need to supercharge your job search or hiring pipeline — built on proprietary AI trained on millions of successful placements.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <div key={i} className="card-base p-6 hover:shadow-card transition-shadow group">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-gradient-to-br text-white shadow-lg', COLOR_MAP[f.color])}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-surface-600 dark:text-surface-400">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 sm:py-28">
          <div className="container-app">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-3">Pricing</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
              <p className="text-surface-600 dark:text-surface-400">Start free. Upgrade when you're ready to level up.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {PRICING.map((p, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-2xl p-7 relative flex flex-col',
                    p.highlight
                      ? 'bg-gradient-to-br from-brand-600 to-brand-800 text-white border-2 border-brand-400 shadow-2xl shadow-brand-500/20 -translate-y-2 z-10'
                      : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800'
                  )}
                >
                  {p.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
                      Most popular
                    </div>
                  )}
                  <h3 className={cn('text-lg font-bold mb-1', p.highlight ? 'text-white' : '')}>{p.name}</h3>
                  <p className={cn('text-sm mb-5', p.highlight ? 'text-white/80' : 'text-surface-500 dark:text-surface-400')}>{p.desc}</p>
                  <div className="mb-6 flex items-end gap-1">
                    <span className={cn('text-4xl font-bold tracking-tight', p.highlight ? '' : '')}>{p.price}</span>
                    <span className={cn('text-sm font-medium pb-1.5', p.highlight ? 'text-white/70' : 'text-surface-500 dark:text-surface-400')}>{p.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {p.features.map((feat, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <Check className={cn('w-4 h-4 mt-0.5 flex-shrink-0', p.highlight ? 'text-brand-200' : 'text-emerald-500')} />
                        <span className={cn(p.highlight ? 'text-white/90' : 'text-surface-700 dark:text-surface-300')}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={cn(
                      'w-full h-11 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]',
                      p.highlight
                        ? 'bg-white text-brand-700 hover:bg-brand-50 shadow-lg'
                        : 'bg-surface-900 dark:bg-white dark:text-surface-900 text-white hover:bg-surface-800 dark:hover:bg-surface-100'
                    )}
                  >
                    {p.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20 sm:py-28 bg-surface-50 dark:bg-surface-900/50 border-y border-surface-200 dark:border-surface-800">
          <div className="container-app">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-3">Loved by thousands</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Real results, real people</h2>
              <div className="flex items-center justify-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                <span className="ml-2 text-sm font-semibold text-surface-700 dark:text-surface-300">4.9 average · 12,400+ reviews</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="card-base p-6 flex flex-col gap-5">
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-sm leading-relaxed text-surface-700 dark:text-surface-300">"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-surface-100 dark:border-surface-800 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="container-app">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white p-8 sm:p-12 lg:p-16">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute -top-24 -left-16 w-80 h-80 bg-white rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -right-16 w-96 h-96 bg-emerald-300 rounded-full blur-3xl" />
              </div>
              <div className="relative max-w-2xl mx-auto text-center space-y-6">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                  Ready to match smarter?
                </h2>
                <p className="text-lg text-white/80 leading-relaxed">
                  Join 250,000+ candidates and recruiters already using HireMind AI to find the perfect fit.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    to="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white text-brand-700 hover:bg-brand-50 text-base font-semibold px-6 h-12 shadow-xl transition-all active:scale-[0.98]"
                  >
                    Create free account
                    <ArrowRight className="w-4.5 h-4.5" />
                  </Link>
                  <a
                    href="#features"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 hover:bg-white/10 text-white text-base font-semibold px-6 h-12 transition-colors"
                  >
                    Learn more
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-surface-200 dark:border-surface-800 py-12 bg-white dark:bg-surface-950">
        <div className="container-app">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <span className="text-xl font-bold tracking-tight">HireMind</span>
              </div>
              <p className="text-sm text-surface-600 dark:text-surface-400 max-w-xs leading-relaxed">
                AI-powered talent matching that transforms how people find careers and companies find stars.
              </p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3">Product</p>
              <ul className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400">Features</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400">Pricing</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400">AI Matching</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3">Company</p>
              <ul className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400">About</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400">Careers</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400">Blog</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3">Legal</p>
              <ul className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400">Privacy</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400">Terms</a></li>
                <li><a href="#" className="hover:text-brand-600 dark:hover:text-brand-400">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-surface-500 dark:text-surface-400">
              © {new Date().getFullYear()} HireMind AI, Inc. All rights reserved.
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1.5">
              Made with <Sparkles className="w-3.5 h-3.5 text-brand-500" /> by HireMind
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
