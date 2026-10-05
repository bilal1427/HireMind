import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import SourceCard from './SourceCard';

export default function AIMessage({ message }) {
  const { role, content, sources = [], children } = message;
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="flex items-start gap-2.5 max-w-[85%] md:max-w-[75%]">
          <div className="flex flex-col items-end gap-1.5">
            <div className="bg-brand-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {content}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center">
            <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start animate-fade-in">
      <div className="flex items-start gap-2.5 max-w-[90%] md:max-w-[85%]">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-soft relative group">
            <button
              onClick={handleCopy}
              className={cn(
                'absolute -top-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border',
                copied
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
                  : 'text-surface-500 bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:bg-surface-50'
              )}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <div className="prose prose-sm dark:prose-invert prose-a:text-brand-600 dark:prose-a:text-brand-400 prose-headings:mt-3 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 max-w-none text-sm leading-relaxed text-surface-700 dark:text-surface-200">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
          {sources && sources.length > 0 && <SourceCard sources={sources} className="max-w-md" />}
          {children}
        </div>
      </div>
    </div>
  );
}
