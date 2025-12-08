/**
 * CSR 데모 페이지 테스트 (src/app/csr/page.tsx)
 *
 * 이 파일은 클라이언트 사이드 렌더링(CSR) 데모 페이지를 테스트합니다.
 *
 * CSR 페이지의 특징:
 * - 'use client' 지시어로 클라이언트 컴포넌트로 동작
 * - useQuery 훅을 사용해 클라이언트에서 데이터를 가져옴
 * - 로딩, 에러, 성공 상태에 따라 다른 UI를 표시
 *
 * 테스트 전략:
 * - usePosts 훅을 모킹하여 다양한 상태(로딩/에러/성공)를 시뮬레이션
 * - 각 상태에서 올바른 UI가 렌더링되는지 확인
 * - 사용자 인터랙션(새로고침 버튼 클릭)이 올바르게 동작하는지 확인
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CSRDemoPage from './page';

/**
 * ========================================
 * 모킹(Mocking) 설정
 * ========================================
 */

/**
 * refetch 함수 모킹
 *
 * vi.fn(): 모킹 함수 생성
 * - 함수가 호출되었는지, 몇 번 호출되었는지, 어떤 인자로 호출되었는지 추적 가능
 * - 새로고침 버튼 클릭 시 refetch가 호출되는지 확인하는 데 사용
 */
const mockRefetch = vi.fn();

/**
 * usePosts 훅 모킹
 *
 * 왜 훅을 모킹하는가?
 * - 실제 API 호출 없이 테스트 가능 (테스트 속도 향상)
 * - 다양한 상태(로딩/에러/성공)를 쉽게 시뮬레이션 가능
 * - 네트워크 상태와 무관하게 일관된 테스트 가능
 */
vi.mock('@/hooks/usePosts', () => ({
  usePosts: vi.fn(), // 빈 모킹 함수로 시작, 각 테스트에서 반환값 설정
}));

/**
 * 하위 컴포넌트들 모킹
 *
 * 테스트 대상은 CSRDemoPage의 로직이므로,
 * 하위 컴포넌트들은 간단한 placeholder로 대체합니다.
 */
vi.mock('@/components/CodeBlock', () => ({
  default: ({ title }: { title: string }) => (
    <div data-testid="code-block" data-title={title}>
      Code Block
    </div>
  ),
}));

vi.mock('@/components/ExplanationCard', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="explanation-card">
      <h3>{title}</h3>
      {children}
    </div>
  ),
}));

vi.mock('@/components/TimingIndicator', () => ({
  default: ({ label }: { label: string }) => (
    <div data-testid="timing-indicator">{label}</div>
  ),
}));

/**
 * 모킹된 훅 import
 *
 * vi.mock() 이후에 import해야 모킹된 버전을 가져옵니다.
 * vi.mocked(): 타입 안전성을 위해 모킹된 함수로 타입 캐스팅
 */
import { usePosts } from '@/hooks/usePosts';
const mockUsePosts = vi.mocked(usePosts);

/**
 * ========================================
 * 테스트 래퍼 (Test Wrapper)
 * ========================================
 *
 * QueryClientProvider 래퍼
 *
 * TanStack Query를 사용하는 컴포넌트는 반드시 QueryClientProvider로 감싸야 합니다.
 * 테스트에서도 마찬가지로, 테스트용 QueryClient를 제공해야 합니다.
 *
 * retry: false - 테스트에서는 실패 시 재시도하지 않음 (빠른 테스트)
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // 테스트에서 재시도 비활성화
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
describe('CSR Demo Page', () => {
  /**
   * beforeEach(): 각 테스트 실행 전에 실행되는 설정
   *
   * vi.clearAllMocks(): 모든 모킹 함수의 호출 기록 초기화
   * - 이전 테스트의 호출 기록이 다음 테스트에 영향을 주지 않도록 함
   */
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * ----------------------------------------
   * 테스트 1: 페이지 제목 렌더링
   * ----------------------------------------
   *
   * 기본적인 페이지 구조가 렌더링되는지 확인
   */
  it('should render the page heading', () => {
    // 모킹 훅의 반환값 설정 (로딩 상태)
    mockUsePosts.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePosts>);

    // wrapper 옵션으로 QueryClientProvider 제공
    render(<CSRDemoPage />, { wrapper: TestWrapper });

    expect(screen.getByRole('heading', { level: 1, name: 'CSR (Client-Side Rendering)' })).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 2: 뒤로가기 링크 확인
   * ----------------------------------------
   */
  it('should render the back link', () => {
    mockUsePosts.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePosts>);

    render(<CSRDemoPage />, { wrapper: TestWrapper });

    // 홈으로 가는 링크가 있고, href가 '/'인지 확인
    expect(screen.getByRole('link', { name: /홈으로/i })).toHaveAttribute('href', '/');
  });

  /**
   * ----------------------------------------
   * 테스트 3: 로딩 상태 UI
   * ----------------------------------------
   *
   * CSR의 핵심: 데이터 로딩 중에는 로딩 UI를 표시
   * isLoading: true 상태에서 로딩 스피너가 표시되는지 확인
   */
  it('should show loading spinner when data is loading', () => {
    mockUsePosts.mockReturnValue({
      data: undefined,
      isLoading: true, // 로딩 중
      isFetching: true,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePosts>);

    render(<CSRDemoPage />, { wrapper: TestWrapper });

    // 로딩 메시지가 표시되는지 확인
    expect(screen.getByText('데이터를 가져오는 중...')).toBeInTheDocument();
    expect(screen.getByText('(클라이언트에서 API 호출 중)')).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 4: 데이터 로드 완료 후 포스트 목록 렌더링
   * ----------------------------------------
   *
   * 성공 상태에서 데이터가 올바르게 렌더링되는지 확인
   */
  it('should render posts when data is loaded', () => {
    // 테스트용 목 데이터 생성
    const mockData = {
      posts: [
        { id: 1, title: '첫 번째 포스트', author: '작성자1', createdAt: '2025-01-01' },
        { id: 2, title: '두 번째 포스트', author: '작성자2', createdAt: '2025-01-02' },
      ],
      meta: {
        fetchedAt: '2025-01-01T12:00:00Z',
        totalCount: 2,
        executedOn: 'client',
      },
    };

    mockUsePosts.mockReturnValue({
      data: mockData,
      isLoading: false, // 로딩 완료
      isFetching: false,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePosts>);

    render(<CSRDemoPage />, { wrapper: TestWrapper });

    // 각 포스트의 제목과 작성자가 렌더링되는지 확인
    expect(screen.getByText('첫 번째 포스트')).toBeInTheDocument();
    expect(screen.getByText('두 번째 포스트')).toBeInTheDocument();
    expect(screen.getByText(/작성자1/)).toBeInTheDocument();
    expect(screen.getByText(/작성자2/)).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 5: 에러 상태 UI
   * ----------------------------------------
   *
   * API 호출 실패 시 에러 메시지가 표시되는지 확인
   */
  it('should show error message when error occurs', () => {
    mockUsePosts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: new Error('API Error'), // 에러 발생
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePosts>);

    render(<CSRDemoPage />, { wrapper: TestWrapper });

    expect(screen.getByText('에러가 발생했습니다.')).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 6: 새로고침 버튼 클릭 시 refetch 호출
   * ----------------------------------------
   *
   * 사용자 인터랙션 테스트
   * fireEvent: DOM 이벤트를 시뮬레이션
   * toHaveBeenCalled(): 모킹 함수가 호출되었는지 확인
   */
  it('should call refetch when refresh button is clicked', () => {
    const mockData = {
      posts: [{ id: 1, title: '포스트', author: '작성자', createdAt: '2025-01-01' }],
      meta: { fetchedAt: '2025-01-01T12:00:00Z', totalCount: 1, executedOn: 'client' },
    };

    mockUsePosts.mockReturnValue({
      data: mockData,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePosts>);

    render(<CSRDemoPage />, { wrapper: TestWrapper });

    // 새로고침 버튼 찾기
    const refreshButton = screen.getByRole('button', { name: '새로고침' });

    // 버튼 클릭 시뮬레이션
    fireEvent.click(refreshButton);

    // refetch 함수가 호출되었는지 확인
    expect(mockRefetch).toHaveBeenCalled();
  });

  /**
   * ----------------------------------------
   * 테스트 7: 페칭 중 버튼 비활성화
   * ----------------------------------------
   *
   * isFetching: true 상태에서 버튼이 비활성화되는지 확인
   * 중복 요청 방지를 위한 UX 패턴
   */
  it('should disable refresh button while fetching', () => {
    mockUsePosts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: true, // 페칭 중
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePosts>);

    render(<CSRDemoPage />, { wrapper: TestWrapper });

    // 버튼 텍스트가 '로딩 중...'으로 변경되고, disabled 상태인지 확인
    const button = screen.getByRole('button', { name: '로딩 중...' });
    expect(button).toBeDisabled();
  });

  /**
   * ----------------------------------------
   * 테스트 8: 코드 블록 렌더링 및 제목 확인
   * ----------------------------------------
   *
   * toHaveAttribute(): HTML 속성값 확인
   */
  it('should render code block for CSR example', () => {
    mockUsePosts.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePosts>);

    render(<CSRDemoPage />, { wrapper: TestWrapper });

    const codeBlock = screen.getByTestId('code-block');
    // data-title 속성이 'CSR 방식 코드'인지 확인
    expect(codeBlock).toHaveAttribute('data-title', 'CSR 방식 코드');
  });

  /**
   * ----------------------------------------
   * 테스트 9: 타이밍 인디케이터 렌더링
   * ----------------------------------------
   *
   * getAllByTestId(): 여러 요소를 배열로 반환
   * toHaveTextContent(): 요소의 텍스트 내용 확인
   *
   * 주의: '컴포넌트 마운트'라는 텍스트가 여러 곳에 있을 수 있으므로
   * getByText 대신 특정 요소의 textContent를 확인
   */
  it('should render timing indicators', () => {
    mockUsePosts.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePosts>);

    render(<CSRDemoPage />, { wrapper: TestWrapper });

    const timingIndicators = screen.getAllByTestId('timing-indicator');

    // 2개의 타이밍 인디케이터가 있어야 함
    expect(timingIndicators).toHaveLength(2);

    // 각 인디케이터의 내용 확인
    expect(timingIndicators[0]).toHaveTextContent('컴포넌트 마운트');
    expect(timingIndicators[1]).toHaveTextContent('API 데이터 로딩');
  });

  /**
   * ----------------------------------------
   * 테스트 10: 설명 카드 렌더링
   * ----------------------------------------
   */
  it('should render explanation cards', () => {
    mockUsePosts.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof usePosts>);

    render(<CSRDemoPage />, { wrapper: TestWrapper });

    const cards = screen.getAllByTestId('explanation-card');
    // CSR 페이지에는 최소 3개의 설명 카드가 있어야 함
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });
});
