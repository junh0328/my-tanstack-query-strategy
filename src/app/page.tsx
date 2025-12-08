import Link from 'next/link';
import CodeBlock from '@/components/CodeBlock';
import ExplanationCard from '@/components/ExplanationCard';

const wrongCode = `// ❌ 기존 코드의 문제점

// 문제 1: 모듈 레벨에서 호출
export const queryClient = getQueryClient();
// → 서버에서 이 모듈이 import될 때마다 실행됨

// 문제 2: Provider props에서 직접 호출
<QueryClientProvider client={getQueryClient()}>
// → 매 렌더링마다 호출될 수 있음`;

const correctCode = `// ✅ 올바른 패턴 (Next.js App Router)

'use client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({ /* 옵션 */ });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // 서버: 항상 새로 생성 (요청 격리)
    return makeQueryClient();
  }
  // 클라이언트: 싱글톤
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export default function QueryProvider({ children }) {
  // useState 초기화 함수로 전달 → 마운트 시 1회만 실행
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}`;

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* 헤더 */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            TanStack Query
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mt-2">
            CSR vs SSR Provider 설정 가이드
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-12">
        {/* 핵심 개념 */}
        <section>
          <h2 className="text-2xl font-bold mb-6">핵심 개념</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <ExplanationCard title="왜 설정이 다른가요?" type="info">
              <p className="mt-2">
                <strong>서버</strong>는 여러 사용자의 요청을 동시에 처리합니다.
                하나의 QueryClient를 공유하면 사용자 A의 데이터가 사용자 B에게 노출될 수 있습니다.
              </p>
              <p className="mt-2">
                <strong>클라이언트</strong>는 한 사용자만 사용하므로 QueryClient를 재사용해도 안전합니다.
                오히려 재사용해야 캐시가 유지됩니다.
              </p>
            </ExplanationCard>

            <ExplanationCard title="3가지 데이터 페칭 전략" type="success">
              <ul className="mt-2 space-y-2">
                <li>
                  <strong>CSR</strong>: 클라이언트에서 useQuery로 fetch
                </li>
                <li>
                  <strong>SSR + Hydration</strong>: 서버에서 prefetch → 클라이언트로 전달
                </li>
                <li>
                  <strong>Streaming</strong>: Suspense로 점진적 렌더링
                </li>
              </ul>
            </ExplanationCard>
          </div>
        </section>

        {/* 기존 코드 문제점 */}
        <section>
          <h2 className="text-2xl font-bold mb-6">기존 코드의 문제점</h2>
          <CodeBlock
            code={wrongCode}
            title="문제가 있는 코드"
            highlight={[4, 5, 8, 9]}
          />
          <div className="mt-4">
            <ExplanationCard title="왜 문제인가요?" type="error">
              <ul className="mt-2 space-y-2">
                <li>
                  <strong>모듈 레벨 호출</strong>: 서버에서 모듈이 캐시되면 모든 요청이 같은 QueryClient를 공유할 수 있음
                </li>
                <li>
                  <strong>Props에서 직접 호출</strong>: React 렌더링 사이클에서 예측하기 어려운 동작
                </li>
              </ul>
            </ExplanationCard>
          </div>
        </section>

        {/* 올바른 패턴 */}
        <section>
          <h2 className="text-2xl font-bold mb-6">올바른 패턴</h2>
          <CodeBlock
            code={correctCode}
            title="권장 패턴 (Next.js App Router)"
            highlight={[13, 14, 15, 17, 18, 19, 20, 21, 24, 25]}
          />
          <div className="mt-4">
            <ExplanationCard title="핵심 포인트" type="success">
              <ul className="mt-2 space-y-2">
                <li>
                  <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">typeof window === &apos;undefined&apos;</code>로 서버/클라이언트 구분
                </li>
                <li>
                  <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">useState(getQueryClient)</code>로 마운트 시 1회만 실행
                </li>
                <li>
                  서버에서는 매번 새 인스턴스, 클라이언트에서는 싱글톤 유지
                </li>
              </ul>
            </ExplanationCard>
          </div>
        </section>

        {/* 데모 링크 */}
        <section>
          <h2 className="text-2xl font-bold mb-6">인터랙티브 데모</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            각 방식의 차이를 직접 체험해보세요. 네트워크 탭을 열어 데이터 로딩 타이밍을 확인할 수 있습니다.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/csr"
              className="block p-6 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
            >
              <div className="text-blue-500 text-2xl mb-2">🌐</div>
              <h3 className="font-semibold text-lg group-hover:text-blue-500 transition-colors">
                CSR Demo
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                클라이언트에서 데이터 페칭
              </p>
              <div className="mt-4 text-xs text-zinc-400">
                • useQuery 사용
                <br />
                • 로딩 스피너 표시
                <br />• JS 실행 후 fetch
              </div>
            </Link>

            <Link
              href="/ssr"
              className="block p-6 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-green-500 dark:hover:border-green-500 transition-colors group"
            >
              <div className="text-green-500 text-2xl mb-2">⚡</div>
              <h3 className="font-semibold text-lg group-hover:text-green-500 transition-colors">
                SSR + Hydration
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                서버에서 미리 데이터 준비
              </p>
              <div className="mt-4 text-xs text-zinc-400">
                • prefetchQuery 사용
                <br />
                • 즉시 렌더링
                <br />• SEO 최적화
              </div>
            </Link>

            <Link
              href="/streaming"
              className="block p-6 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 transition-colors group"
            >
              <div className="text-purple-500 text-2xl mb-2">🚀</div>
              <h3 className="font-semibold text-lg group-hover:text-purple-500 transition-colors">
                Streaming SSR
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                Suspense로 점진적 렌더링
              </p>
              <div className="mt-4 text-xs text-zinc-400">
                • useSuspenseQuery 사용
                <br />
                • 스켈레톤 → 실제 데이터
                <br />• TTFB 개선
              </div>
            </Link>
          </div>
        </section>

        {/* 비교 표 */}
        <section>
          <h2 className="text-2xl font-bold mb-6">방식 비교</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-900">
                  <th className="p-3 text-left border border-zinc-200 dark:border-zinc-800">특성</th>
                  <th className="p-3 text-left border border-zinc-200 dark:border-zinc-800">CSR</th>
                  <th className="p-3 text-left border border-zinc-200 dark:border-zinc-800">SSR + Hydration</th>
                  <th className="p-3 text-left border border-zinc-200 dark:border-zinc-800">Streaming</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800 font-medium">초기 HTML</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">빈 상태 / 스켈레톤</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">완성된 데이터</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">스켈레톤 → 데이터</td>
                </tr>
                <tr>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800 font-medium">TTFB</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">빠름</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">느림 (데이터 대기)</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">빠름</td>
                </tr>
                <tr>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800 font-medium">SEO</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">불리</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">유리</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">유리</td>
                </tr>
                <tr>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800 font-medium">사용 훅</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">useQuery</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">useQuery + prefetch</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">useSuspenseQuery</td>
                </tr>
                <tr>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800 font-medium">적합한 경우</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">대시보드, 인증 필요 페이지</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">SEO 중요, 정적 콘텐츠</td>
                  <td className="p-3 border border-zinc-200 dark:border-zinc-800">복잡한 페이지, 병렬 데이터</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-sm text-zinc-500">
          <p>TanStack Query v5 + Next.js 16 (App Router) + React 19</p>
          <p className="mt-1">2025년 기준 권장 패턴</p>
        </div>
      </footer>
    </div>
  );
}
