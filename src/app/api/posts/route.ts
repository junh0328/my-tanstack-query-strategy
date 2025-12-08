import { NextRequest, NextResponse } from 'next/server';

// Mock 데이터
const posts = [
  { id: 1, title: 'TanStack Query 시작하기', author: '김개발', createdAt: '2025-01-15' },
  { id: 2, title: 'CSR vs SSR 완벽 가이드', author: '이프론트', createdAt: '2025-01-20' },
  { id: 3, title: 'Next.js App Router 이해하기', author: '박리액트', createdAt: '2025-02-01' },
  { id: 4, title: 'React 19 새로운 기능들', author: '최자바', createdAt: '2025-02-10' },
  { id: 5, title: 'Hydration이란 무엇인가?', author: '정타입', createdAt: '2025-02-15' },
];

/**
 * Mock API 엔드포인트
 * 의도적으로 1초 딜레이를 추가하여 로딩 상태를 명확하게 보여줌
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const delay = parseInt(searchParams.get('delay') || '1000', 10);

  // 딜레이 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, delay));

  // 현재 시간과 환경 정보 추가 (CSR/SSR 구분용)
  const timestamp = new Date().toISOString();
  const isServer = typeof window === 'undefined';

  return NextResponse.json({
    posts,
    meta: {
      fetchedAt: timestamp,
      totalCount: posts.length,
      // 이 API는 항상 서버에서 실행됨을 명시
      executedOn: 'server',
    },
  });
}
