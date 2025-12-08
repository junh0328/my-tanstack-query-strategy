'use client';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  highlight?: number[];
}

export default function CodeBlock({ code, language = 'typescript', title, highlight = [] }: CodeBlockProps) {
  const lines = code.split('\n');

  return (
    <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
      {title && (
        <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
          {title}
        </div>
      )}
      <pre className="bg-zinc-50 dark:bg-zinc-950 p-4 overflow-x-auto text-sm">
        <code className={`language-${language}`}>
          {lines.map((line, index) => (
            <div
              key={index}
              className={`${
                highlight.includes(index + 1)
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 -mx-4 px-4'
                  : ''
              }`}
            >
              <span className="inline-block w-8 text-zinc-400 select-none text-right mr-4">
                {index + 1}
              </span>
              {line}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
