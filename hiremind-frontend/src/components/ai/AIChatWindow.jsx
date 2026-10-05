import { useRef, useEffect, useState } from 'react';
import { Trash2, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import AIMessage from './AIMessage';
import TypingIndicator from './TypingIndicator';
import AIInput from './AIInput';

const DEFAULT_SUGGESTIONS = [
  'Summarize this match',
  'What skills are missing?',
  'How can I improve my score?',
  'Compare with other candidates',
];

export default function AIChatWindow({
  messages = [],
  onSend,
  isTyping = false,
  suggestions = DEFAULT_SUGGESTIONS,
  placeholder,
  onClear,
  className,
  title = 'HireMind AI Assistant',
  subtitle = 'Ask anything about your job matches',
}) {
  const scrollRef = useRef(null);
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    setShowClear(messages.length > 0);
  }, [messages.length]);

  return (
    <div className={cn(
      'flex flex-col h-full min-h-[500px] max-h-[750px] rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 overflow-hidden shadow-card',
      className
    )}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white">{title}</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={onClear}
          disabled={!showClear}
          className={cn(
            'btn-ghost !px-2.5 !py-2 text-xs gap-1.5',
            !showClear && 'opacity-40 pointer-events-none'
          )}
          title="Clear chat"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-5"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h4 className="text-lg font-semibold text-surface-900 dark:text-white">
                Start a conversation
              </h4>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Get personalized AI insights on your job matches, skills, and career recommendations.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSend?.(s)}
                  className="text-left text-sm px-4 py-2.5 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 text-surface-700 dark:text-surface-300 hover:border-brand-400 dark:hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <AIMessage key={i} message={m} />
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2.5">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                  </div>
                  <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl rounded-tl-sm px-3 py-2 shadow-soft">
                    <TypingIndicator />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {messages.length > 0 && suggestions.length > 0 && !isTyping && (
        <div className="px-5 pt-2 pb-1 flex gap-2 overflow-x-auto scrollbar-none">
          {suggestions.slice(0, 4).map((s, i) => (
            <button
              key={i}
              onClick={() => onSend?.(s)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-brand-400 dark:hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 pt-3 border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
        <AIInput onSend={onSend} placeholder={placeholder} loading={isTyping} />
      </div>
    </div>
  );
}
