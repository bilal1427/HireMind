import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  UserCircle2,
  FileText,
  Briefcase,
  FolderKanban,
  Sparkles,
  BarChart3,
  CalendarDays,
  Users,
  MessageSquare,
  LineChart,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const CANDIDATE_NAV = [
  {
    group: 'Overview',
    items: [
      { to: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/candidate/profile', label: 'My Profile', icon: UserCircle2 },
      { to: '/candidate/resume', label: 'Resume', icon: FileText },
    ],
  },
  {
    group: 'Career',
    items: [
      { to: '/candidate/jobs', label: 'Jobs', icon: Briefcase },
      { to: '/candidate/applications', label: 'Applications', icon: FolderKanban },
      { to: '/candidate/skill-gap', label: 'Skill Gap Analysis', icon: BarChart3 },
    ],
  },
  {
    group: 'AI & Interviews',
    items: [
      { to: '/candidate/interviews', label: 'Interviews', icon: CalendarDays },
      { to: '/candidate/ai-assistant', label: 'AI Assistant', icon: Sparkles },
    ],
  },
];

const RECRUITER_NAV = [
  {
    group: 'Overview',
    items: [
      { to: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/recruiter/candidates', label: 'Candidates', icon: Users },
    ],
  },
  {
    group: 'Jobs',
    items: [
      { to: '/recruiter/jobs', label: 'All Jobs', icon: Briefcase },
      { to: '/recruiter/jobs/create', label: 'Create Job', icon: FileText },
      { to: '/recruiter/matching', label: 'AI Matching', icon: LineChart },
    ],
  },
  {
    group: 'Hiring',
    items: [
      { to: '/recruiter/interviews', label: 'Interviews', icon: CalendarDays },
      { to: '/recruiter/feedback', label: 'Feedback', icon: MessageSquare },
      { to: '/recruiter/ai-assistant', label: 'AI Assistant', icon: Sparkles },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const nav = user?.role === 'recruiter' ? RECRUITER_NAV : CANDIDATE_NAV;

  const sidebarContent = (isMobile = false) => (
    <>
      <div className={cn(
        'flex items-center gap-2.5 px-4 h-16 border-b border-surface-200 dark:border-surface-800',
        !isMobile && collapsed && 'px-3 justify-center'
      )}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30 flex-shrink-0">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
        </div>
        {(!collapsed || isMobile) && (
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-surface-900 dark:text-white tracking-tight">
              HireMind
            </span>
            <span className="text-[11px] text-surface-500 dark:text-surface-400 font-medium">
              AI Talent Platform
            </span>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={onToggle}
            className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 dark:text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6">
        {nav.map((section, sIdx) => (
          <div key={sIdx}>
            {(!collapsed || isMobile) && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                {section.group}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item, iIdx) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.to);
                return (
                  <li key={iIdx}>
                    <NavLink
                      to={item.to}
                      onClick={isMobile ? onMobileClose : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all relative',
                        collapsed && !isMobile && 'justify-center px-0 w-11 mx-auto',
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                          : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-white'
                      )}
                      title={collapsed && !isMobile ? item.label : undefined}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-brand-600 dark:bg-brand-400 hidden sm:block" />
                      )}
                      <Icon className={cn('w-5 h-5 flex-shrink-0',
                        isActive ? 'text-brand-600 dark:text-brand-400' : 'text-surface-500 dark:text-surface-400 group-hover:text-surface-700 dark:group-hover:text-surface-200'
                      )} />
                      {(!collapsed || isMobile) && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {(!collapsed || isMobile) && user && (
        <div className="p-3 border-t border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 capitalize truncate">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <aside className={cn(
        'hidden lg:flex flex-col flex-shrink-0 border-r border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64'
      )}>
        {sidebarContent(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-surface-950/50 backdrop-blur-sm animate-fade-in"
            onClick={onMobileClose}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-surface-900 flex flex-col animate-slide-right shadow-elevated"
            style={{ animation: 'slideLeftIn 0.3s ease-out' }}
          >
            <style>{`
              @keyframes slideLeftIn {
                from { transform: translateX(-100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            `}</style>
            {sidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
