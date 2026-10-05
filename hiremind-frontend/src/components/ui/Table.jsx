import { cn } from '@/lib/utils';

function Table({ children, className, wrapperClassName, ...props }) {
  return (
    <div className={cn('w-full overflow-auto', wrapperClassName)}>
      <table
        className={cn(
          'w-full caption-bottom text-sm',
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

function TableHeader({ children, className, ...props }) {
  return (
    <thead className={cn('[&_tr]:border-b', className)} {...props}>
      {children}
    </thead>
  );
}

function Thead({ children, className, ...props }) {
  return <TableHeader className={className} {...props}>{children}</TableHeader>;
}

function TableBody({ children, className, ...props }) {
  return (
    <tbody
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

function Tbody({ children, className, ...props }) {
  return <TableBody className={className} {...props}>{children}</TableBody>;
}

function TableFooter({ children, className, ...props }) {
  return (
    <tfoot
      className={cn(
        'border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    >
      {children}
    </tfoot>
  );
}

function TableRow({ children, className, clickable, onClick, ...props }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b border-surface-200 dark:border-surface-800 transition-colors',
        clickable && 'cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50',
        !clickable && 'hover:bg-surface-50/40 dark:hover:bg-surface-800/30',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

function Tr({ children, className, ...props }) {
  return <TableRow className={className} {...props}>{children}</TableRow>;
}

function TableHead({ children, className, ...props }) {
  return (
    <th
      className={cn(
        'h-10 px-4 text-left align-middle font-semibold text-surface-600 dark:text-surface-400',
        'whitespace-nowrap',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

function Th({ children, className, ...props }) {
  return <TableHead className={className} {...props}>{children}</TableHead>;
}

function TableCell({ children, className, ...props }) {
  return (
    <td
      className={cn(
        'px-4 py-3 align-middle text-surface-700 dark:text-surface-300',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

function Td({ children, className, ...props }) {
  return <TableCell className={className} {...props}>{children}</TableCell>;
}

function TableCaption({ children, className, ...props }) {
  return (
    <caption
      className={cn('mt-4 text-sm text-surface-500 dark:text-surface-400', className)}
      {...props}
    >
      {children}
    </caption>
  );
}

export {
  Table,
  TableHeader,
  Thead,
  TableBody,
  Tbody,
  TableFooter,
  TableRow,
  Tr,
  TableHead,
  Th,
  TableCell,
  Td,
  TableCaption,
};
