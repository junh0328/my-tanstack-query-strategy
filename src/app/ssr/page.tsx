import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import Link from 'next/link';
import { getQueryClient } from '@/lib/get-query-client';
import { postsQueryOptions } from '@/hooks/usePosts';
import SSRPostList from './SSRPostList';
import CodeBlock from '@/components/CodeBlock';
import ExplanationCard from '@/components/ExplanationCard';

const serverCode = `// page.tsx (서버 컴포넌트)
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/providers/QueryProvider';

export default async function SSRPage() {
  const queryClient = getQueryClient();

  // 서버에서 데이터 미리 가져오기
  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('/api/posts').then(res => res.json()),
  });

  return (
    // dehydrate로 서버 상태를 직렬화하여 클라이언트로 전달
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostList />
    </HydrationBoundary>
  );
}`;

const clientCode = `// PostList.tsx (클라이언트 컴포넌트)
'use client';

import { useQuery } from '@tanstack/react-query';

export default function PostList() {
  // 서버에서 prefetch한 데이터가 이미 캐시에 있음!
  // → isLoading이 false로 시작, 즉시 렌더링
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('/api/posts').then(res => res.json()),
  });

  return (
    <ul>
      {data?.posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}`;

export default async function SSRDemoPage() {
  const queryClient = getQueryClient();
  const serverRenderTime = new Date().toISOString();

  // 서버에서 데이터 prefetch
  await queryClient.prefetchQuery(postsQueryOptions(1500));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* 헤더 */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1">
            ← 홈으로
          </Link>
          <h1 className="text-2xl font-bold mt-2">SSR + Hydration</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            서버에서 데이터를 미리 가져와 HTML과 함께 전달하는 방식
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 왼쪽: 코드 */}
          <div className="space-y-6">
            <CodeBlock
              code={serverCode}
              title="서버 컴포넌트 (page.tsx)"
              highlight={[8, 9, 10, 11, 16]}
            />

            <CodeBlock
              code={clientCode}
              title="클라이언트 컴포넌트 (PostList.tsx)"
              highlight={[8, 9, 10]}
            />

            <ExplanationCard title="SSR + Hydration 동작 원리" type="info">
              <ol className="list-decimal list-inside space-y-2 mt-2">
                <li><strong>서버 렌더링</strong>: 서버에서 prefetchQuery로 데이터 fetch</li>
                <li><strong>dehydrate</strong>: QueryClient 상태를 JSON으로 직렬화</li>
                <li><strong>HTML 전송</strong>: 완성된 HTML + 직렬화된 상태 전송</li>
                <li><strong>Hydration</strong>: 클라이언트에서 상태를 QueryClient에 복원</li>
                <li><strong>즉시 렌더링</strong>: 캐시에 데이터가 있으므로 로딩 없이 렌더링</li>
              </ol>
            </ExplanationCard>
          </div>

          {/* 오른쪽: 실행 결과 */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <span className="font-medium">실행 결과</span>
                <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                  서버에서 렌더링됨
                </span>
              </div>
              <div className="p-4 min-h-[300px]">
                <HydrationBoundary state={dehydrate(queryClient)}>
                  <SSRPostList />
                </HydrationBoundary>
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
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">서버 렌더링 시각</div>
                </div>
                <div className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                  {serverRenderTime}
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">데이터 Prefetch 완료</div>
                  <div className="text-xs text-zinc-500">클라이언트에서 추가 로딩 없음</div>
                </div>
                <div className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                  0ms
                </div>
              </div>
            </div>

            <ExplanationCard title="Hydration이란?" type="success">
              <p className="mt-2">
                <strong>Hydration</strong>은 서버에서 생성된 정적 HTML에 JavaScript를 &quot;물을 주듯&quot;
                연결하여 인터랙티브하게 만드는 과정입니다.
              </p>
              <p className="mt-2">
                TanStack Query의 경우, <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">dehydrate()</code>로
                서버의 캐시 상태를 직렬화하고, <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">HydrationBoundary</code>로
                클라이언트의 QueryClient에 복원합니다.
              </p>
            </ExplanationCard>

            <ExplanationCard title="CSR과의 차이점" type="warning">
              <div className="mt-2 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-semibold mb-1">CSR</div>
                  <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
                    <li>• 빈 HTML 전송</li>
                    <li>• JS 실행 후 API 호출</li>
                    <li>• 로딩 스피너 표시</li>
                    <li>• SEO 불리</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold mb-1">SSR + Hydration</div>
                  <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
                    <li>• 완성된 HTML 전송</li>
                    <li>• 데이터가 이미 캐시에 있음</li>
                    <li>• 즉시 렌더링</li>
                    <li>• SEO 최적화</li>
                  </ul>
                </div>
              </div>
            </ExplanationCard>
          </div>
        </div>
      </main>
    </div>
  );
}
