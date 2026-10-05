import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date, formatStr = 'MMM dd, yyyy') {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, formatStr);
  } catch {
    return 'N/A';
  }
}

export function formatDateTime(date) {
  return formatDate(date, 'MMM dd, yyyy hh:mm a');
}

export function formatCurrency(n, currency = 'INR', locale = 'en-IN') {
  if (n === null || n === undefined || isNaN(n)) return 'N/A';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₹${n.toLocaleString()}`;
  }
}

export function truncate(s, n = 50) {
  if (!s) return '';
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + '...';
}

export function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function formatSalaryRange(min, max) {
  if (!min && !max) return 'Not specified';
  if (min && !max) return `${formatCurrency(min * 100000)}/yr`;
  if (!min && max) return `Up to ${formatCurrency(max * 100000)}/yr`;
  return `${formatCurrency(min * 100000)} - ${formatCurrency(max * 100000)}/yr`;
}

export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function calculateExperience(years) {
  if (!years) return 'Fresher';
  if (years < 1) return '< 1 yr';
  if (years === 1) return '1 yr';
  if (years < 5) return `${Math.floor(years)} yrs`;
  return `${Math.floor(years)}+ yrs`;
}

export const statusClassMap = {
  applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  screening: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
  shortlisted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
  interview: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
  selected: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800',
  scheduled: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
};

export function getStatusBadgeClass(status) {
  return statusClassMap[status?.toLowerCase?.()] || statusClassMap.pending;
}

export function generateId() {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function debounce(fn, ms = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getRelativeTime(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now - d;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  return `${months}mo ago`;
}

export function getScoreTier(score) {
  if (score >= 90) return { tier: 'excellent', color: 'success', label: 'Excellent Match' };
  if (score >= 75) return { tier: 'great', color: 'brand', label: 'Great Match' };
  if (score >= 60) return { tier: 'good', color: 'info', label: 'Good Match' };
  if (score >= 40) return { tier: 'fair', color: 'warning', label: 'Fair Match' };
  return { tier: 'poor', color: 'danger', label: 'Needs Improvement' };
}

export function getColorClasses(color) {
  const map = {
    brand: {
      bg: 'bg-brand-500',
      bgSoft: 'bg-brand-50 dark:bg-brand-900/40',
      text: 'text-brand-600 dark:text-brand-400',
      border: 'border-brand-200 dark:border-brand-800',
    },
    success: {
      bg: 'bg-emerald-500',
      bgSoft: 'bg-emerald-50 dark:bg-emerald-900/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    info: {
      bg: 'bg-sky-500',
      bgSoft: 'bg-sky-50 dark:bg-sky-900/40',
      text: 'text-sky-600 dark:text-sky-400',
      border: 'border-sky-200 dark:border-sky-800',
    },
    warning: {
      bg: 'bg-amber-500',
      bgSoft: 'bg-amber-50 dark:bg-amber-900/40',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
    },
    danger: {
      bg: 'bg-red-500',
      bgSoft: 'bg-red-50 dark:bg-red-900/40',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
    },
    purple: {
      bg: 'bg-violet-500',
      bgSoft: 'bg-violet-50 dark:bg-violet-900/40',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-200 dark:border-violet-800',
    },
  };
  return map[color] || map.brand;
}

export function formatFileSize(bytes) {
  if (bytes === undefined || bytes === null) return '0 KB';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
