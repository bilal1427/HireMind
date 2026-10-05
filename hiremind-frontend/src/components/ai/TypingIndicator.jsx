import { cn } from '../../lib/utils';

export default function TypingIndicator({ className }) {
  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-1', className)}>
      <div className="w-2 h-2 rounded-full bg-surface-400 dark:bg-surface-500 animate-typing [animation-delay:-0.32s]" />
      <div className="w-2 h-2 rounded-full bg-surface-400 dark:bg-surface-500 animate-typing [animation-delay:-0.16s]" />
      <div className="w-2 h-2 rounded-full bg-surface-400 dark:bg-surface-500 animate-typing" />
    </div>
  );
}
