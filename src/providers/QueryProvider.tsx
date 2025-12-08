'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { getQueryClient } from '@/lib/get-query-client';

/**
 * QueryProvider 컴포넌트
 *
 * 왜 useState를 사용하는가?
 * - React의 컴포넌트 라이프사이클과 일치시키기 위함
 * - useState의 초기값 함수는 컴포넌트 마운트 시 한 번만 실행됨
 * - 이렇게 하면 React의 Strict Mode에서도 안전하게 동작
 *
 * 기존 코드의 문제점:
 * ```tsx
 * // ❌ 잘못된 방법 - props로 직접 호출
 * <QueryClientProvider client={getQueryClient()}>
 *
 * // ❌ 잘못된 방법 - 모듈 레벨에서 생성
 * export const queryClient = getQueryClient();
 * ```
 *
 * 올바른 방법:
 * ```tsx
 * // ✅ useState로 초기화
 * const [queryClient] = useState(getQueryClient)
 * ```
 */
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState에 함수를 전달하면 컴포넌트 마운트 시 한 번만 실행
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
