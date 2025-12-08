import { Suspense } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import Link from 'next/link';
import { getQueryClient } from '@/lib/get-query-client';
import { postsQueryOptions } from '@/hooks/usePosts';
import StreamingPostList from './StreamingPostList';
import CodeBlock from '@/components/CodeBlock';
import ExplanationCard from '@/components/ExplanationCard';

// 빌드 시점에 prerender하지 않고, 요청 시마다 동적으로 렌더링
export const dynamic = 'force-dynamic';

const streamingCode = `// page.tsx (서버 컴포넌트)
import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

export default function StreamingPage() {
  return (
    <div>
      <h1>포스트 목록</h1>

      {/* Suspense로 감싸서 로딩 중에도 다른 UI 먼저 표시 */}
      <Suspense fallback={<LoadingSkeleton />}>
        <PostListWithData />
      </Suspense>
    </div>
  );
}

// 데이터를 가져오는 서버 컴포넌트
async function PostListWithData() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(postsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostList />
    </HydrationBoundary>
  );
}`;

const clientCode = `// PostList.tsx (클라이언트 컴포넌트)
'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

export default function PostList() {
  // useSuspenseQuery: Suspense와 함께 사용
  // - 데이터가 없으면 Promise를 throw하여 Suspense fallback 표시
  // - 데이터가 있으면 바로 렌더링 (data가 undefined가 아님)
  const { data } = useSuspenseQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('/api/posts').then(res => res.json()),
  });

  // data는 항상 존재 (undefined 체크 불필요)
  return (
    <ul>
      {data.posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}`;

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-2" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
        </div>
      ))}
      <div className="text-center text-sm text-zinc-500 mt-4">
        스트리밍 중... (서버에서 데이터를 가져오는 동안 이 UI가 표시됩니다)
      </div>
    </div>
  );
}

async function PostListWithData() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(postsQueryOptions(2000)); // 2초 딜레이로 스트리밍 효과 강조

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StreamingPostList />
    </HydrationBoundary>
  );
}

export default function StreamingDemoPage() {
  const serverRenderTime = new Date().toISOString();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* 헤더 */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1">
            ← 홈으로
          </Link>
          <h1 className="text-2xl font-bold mt-2">Streaming SSR</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Suspense를 활용해 데이터를 기다리는 동안 다른 UI를 먼저 보여주는 방식
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 왼쪽: 코드 */}
          <div className="space-y-6">
            <CodeBlock
              code={streamingCode}
              title="서버 컴포넌트 (page.tsx)"
              highlight={[11, 12, 13]}
            />

            <CodeBlock
              code={clientCode}
              title="클라이언트 컴포넌트 (PostList.tsx)"
              highlight={[6, 7, 8, 9, 10]}
            />

            <ExplanationCard title="Streaming SSR 동작 원리" type="info">
              <ol className="list-decimal list-inside space-y-2 mt-2">
                <li><strong>즉시 응답 시작</strong>: HTML 스트림 전송 시작</li>
                <li><strong>Suspense fallback</strong>: 로딩 스켈레톤 먼저 전송</li>
                <li><strong>데이터 준비</strong>: 서버에서 데이터 fetch (병렬로)</li>
                <li><strong>청크 전송</strong>: 데이터 준비되면 실제 컨텐츠 스트리밍</li>
                <li><strong>점진적 Hydration</strong>: 각 청크별로 인터랙티브하게</li>
              </ol>
            </ExplanationCard>
          </div>

          {/* 오른쪽: 실행 결과 */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <span className="font-medium">실행 결과</span>
                <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                  Streaming
                </span>
              </div>
              <div className="p-4 min-h-[300px]">
                <Suspense fallback={<LoadingSkeleton />}>
                  <PostListWithData />
                </Suspense>
              </div>
            </div>

            {/* 타이밍 정보 */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-zinc-600 dark:text-zinc-400">타이밍</h3>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">페이지 렌더링 시작</div>
                  <div className="text-xs text-zinc-500">헤더, 사이드바 등 즉시 표시</div>
                </div>
                <div className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                  {serverRenderTime}
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900">
                <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">데이터 스트리밍</div>
                  <div className="text-xs text-zinc-500">Suspense fallback 표시 후 실제 데이터로 교체</div>
                </div>
              </div>
            </div>

            <ExplanationCard title="useSuspenseQuery vs useQuery" type="success">
              <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-semibold mb-1">useQuery</div>
                  <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
                    <li>• isLoading 직접 처리</li>
                    <li>• data가 undefined일 수 있음</li>
                    <li>• 수동 로딩 UI 구현</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold mb-1">useSuspenseQuery</div>
                  <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
                    <li>• Suspense가 로딩 처리</li>
                    <li>• data 항상 존재</li>
                    <li>• 선언적 로딩 UI</li>
                  </ul>
                </div>
              </div>
            </ExplanationCard>

            <ExplanationCard title="Streaming의 장점" type="warning">
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong>TTFB 개선</strong>: 첫 번째 바이트 빠르게 전송</li>
                <li><strong>사용자 경험</strong>: 로딩 중에도 페이지 구조 표시</li>
                <li><strong>병렬 처리</strong>: 여러 데이터 소스 동시에 fetch</li>
                <li><strong>점진적 향상</strong>: 준비된 부분부터 인터랙티브</li>
              </ul>
            </ExplanationCard>
          </div>
        </div>
      </main>
    </div>
  );
}
