/**
 * 홈 페이지 테스트 (src/app/page.tsx)
 *
 * 이 파일은 TanStack Query 가이드의 메인 페이지를 테스트합니다.
 * 홈 페이지는 서버 컴포넌트로, 정적인 UI 요소들을 렌더링합니다.
 *
 * 테스트 전략:
 * - 홈 페이지는 데이터 페칭 없이 정적 콘텐츠만 표시하므로
 * - UI 요소가 올바르게 렌더링되는지 확인하는 것이 핵심입니다.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

/**
 * ========================================
 * 모킹(Mocking) 설정
 * ========================================
 *
 * 모킹이란?
 * - 실제 모듈/컴포넌트를 가짜(mock)로 대체하는 것
 * - 테스트를 단순화하고, 테스트 대상에만 집중할 수 있게 해줍니다
 *
 * 왜 모킹이 필요한가?
 * - CodeBlock, ExplanationCard는 이미 별도로 테스트할 수 있는 컴포넌트
 * - 홈 페이지 테스트에서는 "이 컴포넌트들이 렌더링되는가?"만 확인하면 됨
 * - 내부 구현까지 테스트하면 테스트가 복잡해지고 깨지기 쉬워짐
 */

// CodeBlock 컴포넌트를 간단한 div로 대체
vi.mock('@/components/CodeBlock', () => ({
  // default export를 모킹 (export default function CodeBlock)
  default: ({ code, title }: { code: string; title: string }) => (
    <div data-testid="code-block" data-title={title}>
      {code}
    </div>
  ),
}));

// ExplanationCard 컴포넌트를 간단한 div로 대체
vi.mock('@/components/ExplanationCard', () => ({
  default: ({ title, children, type }: { title: string; children: React.ReactNode; type: string }) => (
    <div data-testid="explanation-card" data-type={type}>
      <h3>{title}</h3>
      {children}
    </div>
  ),
}));

/**
 * ========================================
 * 테스트 스위트 (Test Suite)
 * ========================================
 *
 * describe(): 관련된 테스트들을 그룹화
 * - 첫 번째 인자: 테스트 그룹의 이름 (보통 컴포넌트/기능 이름)
 * - 두 번째 인자: 테스트들을 포함하는 함수
 */
describe('Home Page', () => {
  /**
   * ----------------------------------------
   * 테스트 1: 메인 제목 렌더링 확인
   * ----------------------------------------
   *
   * it(): 개별 테스트 케이스
   * - 첫 번째 인자: 테스트가 무엇을 검증하는지 설명 (should로 시작하는 것이 관례)
   * - 두 번째 인자: 실제 테스트 로직
   *
   * render(): 컴포넌트를 가상 DOM에 렌더링
   * screen: 렌더링된 DOM에 접근하는 유틸리티
   * getByRole(): 접근성 역할(role)로 요소를 찾음 - 가장 권장되는 방식
   * toBeInTheDocument(): 해당 요소가 DOM에 존재하는지 확인
   */
  it('should render the main heading', () => {
    render(<Home />);

    // heading role + level 1 = <h1> 태그
    // name: 'TanStack Query' = 해당 텍스트를 가진 h1을 찾음
    expect(screen.getByRole('heading', { level: 1, name: 'TanStack Query' })).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 2: 부제목 렌더링 확인
   * ----------------------------------------
   *
   * getByText(): 텍스트 내용으로 요소를 찾음
   * - 정확한 텍스트 매칭이 필요할 때 사용
   */
  it('should render the subtitle', () => {
    render(<Home />);

    expect(screen.getByText('CSR vs SSR Provider 설정 가이드')).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 3: 네비게이션 링크 확인
   * ----------------------------------------
   *
   * 여러 링크가 올바른 href를 가지고 있는지 확인
   * toHaveAttribute(): 요소의 HTML 속성값 검증
   *
   * 정규표현식 사용: /CSR Demo/i
   * - /.../ : 정규표현식 리터럴
   * - i : 대소문자 무시 (case-insensitive)
   */
  it('should render navigation links to demo pages', () => {
    render(<Home />);

    // 각 데모 페이지로 가는 링크 찾기
    const csrLink = screen.getByRole('link', { name: /CSR Demo/i });
    const ssrLink = screen.getByRole('link', { name: /SSR \+ Hydration/i });
    const streamingLink = screen.getByRole('link', { name: /Streaming SSR/i });

    // 각 링크의 href 속성 확인
    expect(csrLink).toHaveAttribute('href', '/csr');
    expect(ssrLink).toHaveAttribute('href', '/ssr');
    expect(streamingLink).toHaveAttribute('href', '/streaming');
  });

  /**
   * ----------------------------------------
   * 테스트 4: 섹션 헤딩 렌더링 확인
   * ----------------------------------------
   *
   * 페이지의 주요 섹션들이 모두 렌더링되는지 확인
   * - 사용자가 페이지 구조를 파악할 수 있는 핵심 요소들
   */
  it('should render section headings', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { name: '핵심 개념' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '기존 코드의 문제점' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '올바른 패턴' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '인터랙티브 데모' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '방식 비교' })).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 5: 비교 테이블 렌더링 확인
   * ----------------------------------------
   *
   * 테이블과 테이블 헤더가 올바르게 렌더링되는지 확인
   * getByRole('table'): <table> 요소 찾기
   * getByRole('columnheader'): <th> 요소 찾기
   */
  it('should render the comparison table', () => {
    render(<Home />);

    // 테이블 존재 확인
    expect(screen.getByRole('table')).toBeInTheDocument();

    // 테이블 헤더(컬럼명) 확인
    expect(screen.getByRole('columnheader', { name: '특성' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'CSR' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'SSR + Hydration' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Streaming' })).toBeInTheDocument();
  });

  /**
   * ----------------------------------------
   * 테스트 6: 코드 블록 렌더링 확인
   * ----------------------------------------
   *
   * getAllByTestId(): data-testid 속성으로 여러 요소 찾기
   * - getByTestId는 1개만 찾고, getAllByTestId는 여러 개를 배열로 반환
   *
   * toBeGreaterThanOrEqual(): 배열 길이가 최소 N개 이상인지 확인
   * - 정확한 개수보다 "최소 N개"로 테스트하면 유지보수가 쉬움
   */
  it('should render code blocks', () => {
    render(<Home />);

    const codeBlocks = screen.getAllByTestId('code-block');
    // 최소 2개의 코드 블록이 있어야 함 (잘못된 코드, 올바른 코드)
    expect(codeBlocks.length).toBeGreaterThanOrEqual(2);
  });

  /**
   * ----------------------------------------
   * 테스트 7: 설명 카드 렌더링 확인
   * ----------------------------------------
   */
  it('should render explanation cards', () => {
    render(<Home />);

    const explanationCards = screen.getAllByTestId('explanation-card');
    // 최소 4개의 설명 카드가 있어야 함
    expect(explanationCards.length).toBeGreaterThanOrEqual(4);
  });

  /**
   * ----------------------------------------
   * 테스트 8: 푸터 버전 정보 확인
   * ----------------------------------------
   *
   * 정규표현식으로 부분 문자열 매칭
   * /TanStack Query v5/ : "TanStack Query v5"를 포함하는 텍스트
   */
  it('should render footer with version info', () => {
    render(<Home />);

    expect(screen.getByText(/TanStack Query v5/)).toBeInTheDocument();
    expect(screen.getByText(/Next\.js 16/)).toBeInTheDocument();
  });
});
