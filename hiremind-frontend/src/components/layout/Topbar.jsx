import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Topbar({ onToggleSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  const NOTIFICATIONS = [
    { id: 1, title: 'New match! Senior React role', time: '2m ago', unread: true },
    { id: 2, title: 'Interview scheduled for Fri 3PM', time: '1h ago', unread: true },
    { id: 3, title: 'Your resume was viewed by TechCorp', time: '3h ago', unread: false },
  ];

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <header className="h-16 flex-shrink-0 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 sticky top-0 z-30">
      <div className="h-full px-4 sm:px-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden w-9 h-9 -ml-1.5 rounded-lg flex items-center justify-center text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:flex items-center flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 dark:text-surface-500" />
              <input
                type="text"
                placeholder="Search jobs, candidates, skills..."
                className="w-full h-9 pl-9 pr-4 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm text-surface-800 dark:text-surface-200 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:border-brand-400 dark:focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-surface-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-elevated overflow-hidden animate-slide-down">
                <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-surface-900 dark:text-white">Notifications</h3>
                  <button className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">
                    Mark all read
                  </button>
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {NOTIFICATIONS.map((n) => (
                    <li key={n.id} className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 last:border-b-0 hover:bg-surface-50 dark:hover:bg-surface-800/50 cursor-pointer transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                          n.unread ? 'bg-brand-500' : 'bg-transparent'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm',
                            n.unread
                              ? 'font-medium text-surface-900 dark:text-white'
                              : 'text-surface-600 dark:text-surface-300'
                          )}>
                            {n.title}
                          </p>
                          <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
                            {n.time}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div ref={menuRef} className="relative ml-1">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl pl-1 pr-2.5 py-1 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-surface-900 dark:text-white leading-tight">
                  {user?.name || 'Guest'}
                </p>
                <p className="text-[11px] text-surface-500 dark:text-surface-400 capitalize leading-tight">
                  {user?.role || 'user'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-surface-400 dark:text-surface-500 hidden sm:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-elevated overflow-hidden animate-slide-down">
                <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-800 sm:hidden">
                  <p className="text-sm font-semibold text-surface-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 capitalize">{user?.role}</p>
                </div>
                <div className="py-1.5">
                  <Link
                    to={`/${user?.role}/profile`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                  >
                    <User className="w-4 h-4 text-surface-400" />
                    Profile
                  </Link>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                  >
                    <Settings className="w-4 h-4 text-surface-400" />
                    Settings
                  </button>
                </div>
                <div className="py-1.5 border-t border-surface-200 dark:border-surface-800">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
