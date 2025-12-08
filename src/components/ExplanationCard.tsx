interface ExplanationCardProps {
  title: string;
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success' | 'error';
}

const typeStyles = {
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800',
  success: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
  error: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
};

const iconStyles = {
  info: '💡',
  warning: '⚠️',
  success: '✅',
  error: '❌',
};

export default function ExplanationCard({ title, children, type = 'info' }: ExplanationCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${typeStyles[type]}`}>
      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
        <span>{iconStyles[type]}</span>
        {title}
      </h3>
      <div className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}
