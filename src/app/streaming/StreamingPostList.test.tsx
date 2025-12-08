/**
 * Streaming PostList 컴포넌트 테스트 (src/app/streaming/StreamingPostList.tsx)
 *
 * 이 파일은 Streaming SSR 페이지의 클라이언트 컴포넌트를 테스트합니다.
 *
 * Streaming SSR이란?
 * - React 18의 Suspense와 함께 사용하는 서버 렌더링 방식
 * - 페이지의 일부를 먼저 보내고, 데이터가 준비되면 나머지를 스트리밍
 * - 사용자는 로딩 스켈레톤을 먼저 보고, 데이터가 준비되면 실제 콘텐츠로 교체됨
 *
 * useSuspenseQuery vs useQuery:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  useQuery                    │  useSuspenseQuery            │
 * ├─────────────────────────────────────────────────────────────┤
 * │  isLoading 직접 처리         │  Suspense가 로딩 처리        │
 * │  data가 undefined일 수 있음  │  data 항상 존재              │
 * │  수동 로딩 UI 구현           │  선언적 로딩 UI (Suspense)   │
 * └─────────────────────────────────────────────────────────────┘
 *
 * 테스트에서의 useSuspenseQuery:
 * - 실제로는 데이터가 없으면 Promise를 throw하여 Suspense를 트리거
 * - 테스트에서는 훅을 모킹하여 데이터가 항상 있는 상태로 시뮬레이션
 * - Suspense 동작 자체는 E2E 테스트로 검증하는 것이 적합
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StreamingPostList from './StreamingPostList';

/**
 * ========================================
 * 훅 모킹
 * ========================================
 *
 * usePostsSuspense 훅 모킹
 *
 * 주의: useSuspenseQuery의 특성
 * - 데이터가 없으면 Promise를 throw (Suspense 트리거)
 * - 데이터가 있으면 data가 항상 존재 (undefined가 아님!)
 * - 따라서 모킹할 때 항상 data를 제공해야 함
 */
vi.mock('@/hooks/usePosts', () => ({
  usePostsSuspense: vi.fn(),
}));

import { usePostsSuspense } from '@/hooks/usePosts';

const mockUsePostsSuspense = vi.mocked(usePostsSuspense);

/**
 * ========================================
 * 테스트 래퍼
 * ========================================
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
 *
 * StreamingPostList는 useSuspenseQuery를 사용하므로
 * - isLoading 상태 테스트가 없음 (Suspense가 처리)
 * - 에러 상태 테스트가 없음 (ErrorBoundary가 처리)
 * - 데이터가 있는 상태만 테스트
 *
 * 이것이 useSuspenseQuery의 장점:
 * - 컴포넌트 코드가 단순해짐 (로딩/에러 처리 불필요)
 * - 테스트도 단순해짐
 */
describe('StreamingPostList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * ----------------------------------------
   * 테스트 1: 포스트 목록 렌더링
   * ----------------------------------------
   *
   * useSuspenseQuery 사용 시 data는 항상 존재
   * - undefined 체크 불필요
   * - data.posts.map() 바로 사용 가능
   */
  it('should render posts when data is available', () => {
    const mockData = {
      posts: [
        { id: 1, title: 'Streaming 포스트 1', author: '작성자X', createdAt: '2025-01-01' },
        { id: 2, title: 'Streaming 포스트 2', author: '작성자Y', createdAt: '2025-01-02' },
      ],
      meta: {
        fetchedAt: '2025-01-01T12:00:00Z',
        totalCount: 2,
        executedOn: 'server',
      },
    };

    mockUsePostsSuspense.mockReturnValue({
      data: mockData,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePostsSuspense>);

    render(<StreamingPostList />, { wrapper: TestWrapper });

    // 포스트 제목이 렌더링되는지 확인
    expect(screen.getByText('Streaming 포스트 1')).toBeInTheDocument();
    expect(screen.getByText('Streaming 포스트 2')).toBeInTheDocument();

    // 작성자 정보가 렌더링되는지 확인
    expect(screen.getByText(/작성자X/)).toBeInTheDocument();
    expect(screen.getByText(/작성자Y/)).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 2: 메타 정보 표시
   * ----------------------------------------
   */
  it('should display meta information', () => {
    const mockData = {
      posts: [{ id: 1, title: '포스트', author: '작성자', createdAt: '2025-01-01' }],
      meta: {
        fetchedAt: '2025-01-01T12:00:00Z',
        totalCount: 5,
        executedOn: 'server',
      },
    };

    mockUsePostsSuspense.mockReturnValue({
      data: mockData,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePostsSuspense>);

    render(<StreamingPostList />, { wrapper: TestWrapper });

    expect(screen.getByText(/데이터 수신 시각:/)).toBeInTheDocument();
    expect(screen.getByText('총 5개의 포스트')).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 3: Streaming SSR 인디케이터
   * ----------------------------------------
   *
   * Streaming 페이지만의 특별한 UI
   * SSR과 구분되는 메시지로 Streaming이 동작함을 표시
   */
  it('should show streaming SSR indicator', () => {
    const mockData = {
      posts: [{ id: 1, title: '포스트', author: '작성자', createdAt: '2025-01-01' }],
      meta: {
        fetchedAt: '2025-01-01T12:00:00Z',
        totalCount: 1,
        executedOn: 'server',
      },
    };

    mockUsePostsSuspense.mockReturnValue({
      data: mockData,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePostsSuspense>);

    render(<StreamingPostList />, { wrapper: TestWrapper });

    // Streaming SSR 메시지가 표시되는지 확인
    expect(screen.getByText(/Streaming SSR로 전달된 데이터입니다/)).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 4: 리스트 아이템 개수 확인
   * ----------------------------------------
   *
   * getAllByRole('listitem'): <li> 요소들을 배열로 반환
   * toHaveLength(): 배열의 길이를 정확히 확인
   */
  it('should render correct number of list items', () => {
    const mockData = {
      posts: [
        { id: 1, title: '포스트 1', author: '작성자1', createdAt: '2025-01-01' },
        { id: 2, title: '포스트 2', author: '작성자2', createdAt: '2025-01-02' },
        { id: 3, title: '포스트 3', author: '작성자3', createdAt: '2025-01-03' },
        { id: 4, title: '포스트 4', author: '작성자4', createdAt: '2025-01-04' },
      ],
      meta: {
        fetchedAt: '2025-01-01T12:00:00Z',
        totalCount: 4,
        executedOn: 'server',
      },
    };

    mockUsePostsSuspense.mockReturnValue({
      data: mockData,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePostsSuspense>);

    render(<StreamingPostList />, { wrapper: TestWrapper });

    // <li> 요소의 개수가 포스트 개수와 일치하는지 확인
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(4);
  });

  /**
   * ----------------------------------------
   * 테스트 5: 포스트 상세 정보 (작성자, 날짜) 표시
   * ----------------------------------------
   *
   * 각 포스트 아이템에 작성자와 작성일이 올바르게 표시되는지 확인
   */
  it('should display post author and date', () => {
    const mockData = {
      posts: [
        { id: 1, title: '포스트 제목', author: '테스트 작성자', createdAt: '2025-12-08' },
      ],
      meta: {
        fetchedAt: '2025-01-01T12:00:00Z',
        totalCount: 1,
        executedOn: 'server',
      },
    };

    mockUsePostsSuspense.mockReturnValue({
      data: mockData,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePostsSuspense>);

    render(<StreamingPostList />, { wrapper: TestWrapper });

    // 작성자와 날짜가 표시되는지 확인
    expect(screen.getByText(/테스트 작성자/)).toBeInTheDocument();
    expect(screen.getByText(/2025-12-08/)).toBeInTheDocument();
  });
});
