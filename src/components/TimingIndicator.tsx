'use client';

import { useEffect, useState } from 'react';

interface TimingIndicatorProps {
  startTime: number | null;
  endTime: number | null;
  label: string;
}

export default function TimingIndicator({ startTime, endTime, label }: TimingIndicatorProps) {
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    if (startTime && !endTime) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 100);
      return () => clearInterval(interval);
    }
  }, [startTime, endTime]);

  const elapsed = endTime
    ? endTime - (startTime || endTime)
    : startTime
    ? currentTime - startTime
    : 0;

  const isLoading = startTime !== null && endTime === null;
  const isComplete = startTime !== null && endTime !== null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900">
      <div className="flex-shrink-0">
        {isLoading && (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
        {isComplete && (
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {!isLoading && !isComplete && (
          <div className="w-4 h-4 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</div>
      </div>
      <div className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
        {elapsed > 0 ? `${elapsed}ms` : '-'}
      </div>
    </div>
  );
}
