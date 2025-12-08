'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePosts } from '@/hooks/usePosts';
import CodeBlock from '@/components/CodeBlock';
import ExplanationCard from '@/components/ExplanationCard';
import TimingIndicator from '@/components/TimingIndicator';

const csrCode = `// CSR (Client-Side Rendering) 방식
'use client';

import { useQuery } from '@tanstack/react-query';

export default function CSRPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('/api/posts').then(res => res.json()),
  });

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러 발생!</div>;

  return (
    <ul>
      {data.posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}`;

export default function CSRDemoPage() {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [mountTime] = useState(() => Date.now());

  const { data, isLoading, isFetching, error, refetch } = usePosts(1500);

  useEffect(() => {
    if (isLoading && !startTime) {
      setStartTime(Date.now());
    }
    if (!isLoading && startTime && !endTime) {
      setEndTime(Date.now());
    }
  }, [isLoading, startTime, endTime]);

  const handleRefresh = () => {
    setStartTime(Date.now());
    setEndTime(null);
    refetch();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* 헤더 */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1">
            ← 홈으로
          </Link>
          <h1 className="text-2xl font-bold mt-2">CSR (Client-Side Rendering)</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            클라이언트에서 JavaScript가 실행된 후 데이터를 가져오는 방식
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 왼쪽: 코드 */}
          <div className="space-y-6">
            <CodeBlock
              code={csrCode}
              title="CSR 방식 코드"
              highlight={[7, 8, 9, 10, 12]}
            />

            <ExplanationCard title="CSR 동작 원리" type="info">
              <ol className="list-decimal list-inside space-y-2 mt-2">
                <li><strong>HTML 전송</strong>: 서버가 빈 HTML (또는 스켈레톤) 전송</li>
                <li><strong>JS 다운로드</strong>: 브라우저가 JavaScript 번들 다운로드</li>
                <li><strong>컴포넌트 마운트</strong>: React 컴포넌트가 마운트됨</li>
                <li><strong>useQuery 실행</strong>: 마운트 후 API 호출 시작</li>
                <li><strong>데이터 렌더링</strong>: 응답 수신 후 UI 업데이트</li>
              </ol>
            </ExplanationCard>

            <ExplanationCard title="언제 CSR을 사용하나요?" type="success">
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>SEO가 중요하지 않은 대시보드, 관리자 페이지</li>
                <li>사용자 인터랙션에 따라 데이터가 자주 바뀌는 경우</li>
                <li>초기 로딩 속도보다 인터랙티브함이 중요한 경우</li>
                <li>인증이 필요한 개인화된 데이터</li>
              </ul>
            </ExplanationCard>
          </div>

          {/* 오른쪽: 실행 결과 */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <span className="font-medium">실행 결과</span>
                <button
                  onClick={handleRefresh}
                  disabled={isFetching}
                  className="px-3 py-1 text-sm bg-zinc-200 dark:bg-zinc-800 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50"
                >
                  {isFetching ? '로딩 중...' : '새로고침'}
                </button>
              </div>
              <div className="p-4 min-h-[300px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p>데이터를 가져오는 중...</p>
                    <p className="text-xs mt-1 text-zinc-400">
                      (클라이언트에서 API 호출 중)
                    </p>
                  </div>
                ) : error ? (
                  <div className="text-red-500">에러가 발생했습니다.</div>
                ) : data ? (
                  <div>
                    <ul className="space-y-3">
                      {data.posts.map((post) => (
                        <li
                          key={post.id}
                          className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg"
                        >
                          <div className="font-medium">{post.title}</div>
                          <div className="text-sm text-zinc-500 mt-1">
                            {post.author} · {post.createdAt}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
                      <p>데이터 수신 시각: {data.meta.fetchedAt}</p>
                      <p>총 {data.meta.totalCount}개의 포스트</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* 타이밍 정보 */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-zinc-600 dark:text-zinc-400">타이밍</h3>
              <TimingIndicator
                startTime={mountTime}
                endTime={mountTime}
                label="컴포넌트 마운트"
              />
              <TimingIndicator
                startTime={startTime}
                endTime={endTime}
                label="API 데이터 로딩"
              />
            </div>

            <ExplanationCard title="CSR의 단점" type="warning">
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong>초기 로딩 지연</strong>: JS 실행 + API 호출 대기 시간</li>
                <li><strong>SEO 불리</strong>: 검색엔진이 빈 HTML을 볼 수 있음</li>
                <li><strong>Layout Shift</strong>: 데이터 로드 후 화면이 변경됨</li>
                <li><strong>워터폴</strong>: HTML → JS → API 순차 실행</li>
              </ul>
            </ExplanationCard>
          </div>
        </div>
      </main>
    </div>
  );
}
