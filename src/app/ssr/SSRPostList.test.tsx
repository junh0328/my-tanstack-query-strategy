/**
 * SSR PostList 컴포넌트 테스트 (src/app/ssr/SSRPostList.tsx)
 *
 * 이 파일은 서버 사이드 렌더링(SSR) 페이지의 클라이언트 컴포넌트를 테스트합니다.
 *
 * SSR 페이지 구조:
 * - page.tsx: 서버 컴포넌트 (async function) - 데이터 prefetch
 * - SSRPostList.tsx: 클라이언트 컴포넌트 - 데이터 표시
 *
 * SSR의 핵심 개념:
 * - 서버에서 prefetchQuery로 데이터를 미리 가져옴
 * - dehydrate()로 서버 상태를 직렬화
 * - HydrationBoundary로 클라이언트에 전달
 * - 클라이언트에서 useQuery 사용 시 이미 캐시에 데이터가 있음!
 *
 * 왜 SSRPostList만 테스트하는가?
 * - page.tsx는 async 서버 컴포넌트로, 일반적인 방식으로 테스트하기 어려움
 * - 비즈니스 로직과 UI 렌더링은 SSRPostList에 있으므로 이것만 테스트해도 충분
 * - 서버 컴포넌트 테스트는 E2E 테스트로 다루는 것이 적합
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SSRPostList from './SSRPostList';

/**
 * ========================================
 * 훅 모킹
 * ========================================
 *
 * usePosts 훅을 모킹하여 테스트를 단순화합니다.
 *
 * SSR 환경에서의 usePosts 동작:
 * - 서버에서 prefetch한 데이터가 이미 캐시에 있음
 * - 따라서 isLoading이 false로 시작하고, data가 즉시 사용 가능
 * - 로딩 스피너가 보이지 않음 (이것이 SSR의 장점!)
 *
 * 하지만 테스트에서는 다양한 상태를 시뮬레이션하기 위해
 * 로딩 상태도 테스트합니다 (예: 캐시가 만료된 경우)
 */
vi.mock('@/hooks/usePosts', () => ({
  usePosts: vi.fn(),
}));

import { usePosts } from '@/hooks/usePosts';

const mockUsePosts = vi.mocked(usePosts);

/**
 * ========================================
 * 테스트 래퍼
 * ========================================
 *
 * TanStack Query를 사용하는 컴포넌트 테스트에 필요한 Provider
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/**
 * ========================================
 * 테스트 스위트
 * ========================================
 */
describe('SSRPostList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * ----------------------------------------
   * 테스트 1: 로딩 상태 UI
   * ----------------------------------------
   *
   * 일반적인 SSR에서는 이 상태가 보이지 않지만,
   * 캐시 만료 후 재페칭 시에는 로딩 상태가 될 수 있음
   */
  it('should show loading spinner when loading', () => {
    mockUsePosts.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePosts>);

    render(<SSRPostList />, { wrapper: TestWrapper });

    expect(screen.getByText('데이터를 가져오는 중...')).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 2: 에러 상태 UI
   * ----------------------------------------
   */
  it('should show error message when error occurs', () => {
    mockUsePosts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: new Error('API Error'),
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePosts>);

    render(<SSRPostList />, { wrapper: TestWrapper });

    expect(screen.getByText('에러가 발생했습니다.')).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 3: 포스트 목록 렌더링
   * ----------------------------------------
   *
   * SSR의 핵심 테스트: 데이터가 있을 때 올바르게 렌더링되는가?
   * 실제 SSR에서는 서버에서 prefetch한 데이터가 즉시 표시됨
   */
  it('should render posts when data is loaded', () => {
    const mockData = {
      posts: [
        { id: 1, title: 'SSR 포스트 1', author: '작성자A', createdAt: '2025-01-01' },
        { id: 2, title: 'SSR 포스트 2', author: '작성자B', createdAt: '2025-01-02' },
        { id: 3, title: 'SSR 포스트 3', author: '작성자C', createdAt: '2025-01-03' },
      ],
      meta: {
        fetchedAt: '2025-01-01T12:00:00Z',
        totalCount: 3,
        executedOn: 'server', // 서버에서 실행됨을 표시
      },
    };

    mockUsePosts.mockReturnValue({
      data: mockData,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePosts>);

    render(<SSRPostList />, { wrapper: TestWrapper });

    // 모든 포스트가 렌더링되는지 확인
    expect(screen.getByText('SSR 포스트 1')).toBeInTheDocument();
    expect(screen.getByText('SSR 포스트 2')).toBeInTheDocument();
    expect(screen.getByText('SSR 포스트 3')).toBeInTheDocument();

    // 작성자 정보도 표시되는지 확인
    expect(screen.getByText(/작성자A/)).toBeInTheDocument();
    expect(screen.getByText(/작성자B/)).toBeInTheDocument();
    expect(screen.getByText(/작성자C/)).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 4: 메타 정보 표시
   * ----------------------------------------
   *
   * 데이터 수신 시각, 총 개수 등 메타 정보가 표시되는지 확인
   */
  it('should display meta information', () => {
    const mockData = {
      posts: [{ id: 1, title: '포스트', author: '작성자', createdAt: '2025-01-01' }],
      meta: {
        fetchedAt: '2025-01-01T12:00:00Z',
        totalCount: 10,
        executedOn: 'server',
      },
    };

    mockUsePosts.mockReturnValue({
      data: mockData,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePosts>);

    render(<SSRPostList />, { wrapper: TestWrapper });

    // 메타 정보가 표시되는지 확인
    expect(screen.getByText(/데이터 수신 시각:/)).toBeInTheDocument();
    expect(screen.getByText('총 10개의 포스트')).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 5: SSR Prefetch 인디케이터
   * ----------------------------------------
   *
   * SSR 페이지만의 특별한 UI: "서버에서 prefetch된 데이터입니다" 메시지
   * 이 메시지로 사용자(개발자)가 SSR이 제대로 동작하는지 확인 가능
   */
  it('should show SSR prefetch indicator', () => {
    const mockData = {
      posts: [{ id: 1, title: '포스트', author: '작성자', createdAt: '2025-01-01' }],
      meta: {
        fetchedAt: '2025-01-01T12:00:00Z',
        totalCount: 1,
        executedOn: 'server',
      },
    };

    mockUsePosts.mockReturnValue({
      data: mockData,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePosts>);

    render(<SSRPostList />, { wrapper: TestWrapper });

    // SSR prefetch 메시지가 표시되는지 확인
    expect(screen.getByText(/서버에서 prefetch된 데이터입니다/)).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 6: 빈 포스트 배열 처리
   * ----------------------------------------
   *
   * 엣지 케이스: 데이터는 성공적으로 받았지만 포스트가 없는 경우
   * 애플리케이션이 크래시하지 않고 올바르게 처리하는지 확인
   */
  it('should handle empty posts array', () => {
    const mockData = {
      posts: [], // 빈 배열
      meta: {
        fetchedAt: '2025-01-01T12:00:00Z',
        totalCount: 0,
        executedOn: 'server',
      },
    };

    mockUsePosts.mockReturnValue({
      data: mockData,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePosts>);

    render(<SSRPostList />, { wrapper: TestWrapper });

    // 빈 상태에서도 메타 정보는 표시되어야 함
    expect(screen.getByText('총 0개의 포스트')).toBeInTheDocument();
  });
});
