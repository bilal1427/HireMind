import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, ArrowUp } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AIInput({
  onSend,
  placeholder = 'Ask anything about your job match...',
  loading = false,
  disabled = false,
  className,
}) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [value]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading || disabled) return;
    onSend?.(trimmed);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'relative rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 focus-within:border-brand-400 dark:focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all',
        className
      )}
    >
      <div className="flex items-end gap-2 p-2">
        <button
          type="button"
          disabled
          title="Attach (coming soon)"
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 dark:text-surface-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          <Paperclip className="w-4.5 h-4.5" />
        </button>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm text-surface-800 dark:text-surface-200 placeholder:text-surface-400 dark:placeholder:text-surface-500 py-2.5 px-2 outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!value.trim() || loading || disabled}
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all',
            value.trim() && !loading && !disabled
              ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/20'
              : 'bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500 cursor-not-allowed'
          )}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <ArrowUp className="w-4.5 h-4.5" />
          )}
        </button>
      </div>
    </form>
  );
}
