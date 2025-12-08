# TanStack Query v5: CSR vs SSR vs Streaming - 면접에서 살아남기

> Next.js App Router 환경에서 TanStack Query의 세 가지 데이터 페칭 전략을 비교 분석합니다.

## 들어가며

"TanStack Query에서 SSR과 Streaming의 차이점이 뭔가요?"

프론트엔드 면접에서 자주 등장하는 질문입니다. 단순히 "SSR은 서버에서 렌더링하고, Streaming은 청크로 보내요"라고 답하면 해당 질문의 의도가 아닐 수 있습니다. **Hydration 과정**, **QueryClient 관리**, **훅의 동작 차이**까지 설명할 수 있어야 합니다.

이 글에서는 실제 동작하는 예제 코드와 함께 면접에서 차별화될 수 있는 포인트들을 정리합니다.

## 목차

1. [QueryClient 설정 - 왜 서버와 클라이언트를 분리하는가?](#1-queryclient-설정---왜-서버와-클라이언트를-분리하는가)
2. [CSR: 가장 단순한 방식](#2-csr-가장-단순한-방식)
3. [SSR + Hydration: dehydrate의 마법](#3-ssr--hydration-dehydrate의-마법)
4. [Streaming: useSuspenseQuery의 진가](#4-streaming-usesuspensequery의-진가)
5. [useQuery vs useSuspenseQuery](#5-usequery-vs-usesuspensequery)
6. [면접 예상 질문 & 모범 답안](#6-면접-예상-질문--모범-답안)

## 1. QueryClient 설정 - 왜 서버와 클라이언트를 분리하는가?

### 문제 상황

```typescript
// ❌ 안티패턴: 모듈 레벨에서 생성
const queryClient = new QueryClient();

export default function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

**왜 문제인가?**

- 서버에서 모듈이 한 번만 로드됨
- **모든 사용자가 같은 QueryClient 인스턴스를 공유**
- A 사용자의 캐시된 데이터가 B 사용자에게 노출될 수 있음

### 올바른 패턴

```typescript
// get-query-client.ts
import { QueryClient, isServer } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) {
    // 서버: 매 요청마다 새 인스턴스 (사용자 간 데이터 격리)
    return makeQueryClient();
  }

  // 클라이언트: 싱글톤 (상태 유지)
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
```

```typescript
// QueryProvider.tsx
'use client';

export default function QueryProvider({ children }) {
  // useState의 초기화 함수로 전달 - 단 한 번만 실행됨
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

**면접 포인트:**

- `isServer` 체크로 환경 분리
- 서버는 요청마다 새 인스턴스 (보안)
- 클라이언트는 싱글톤 (상태 유지)
- `useState` 초기화 함수로 React Strict Mode 대응

## 2. CSR: 가장 단순한 방식

### 예제 코드

```typescript
// app/csr/page.tsx
'use client';

import { usePosts } from '@/hooks/usePosts';

export default function CSRPage() {
  const { data, isLoading, error, isFetching } = usePosts(1500);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <ul>
      {data?.posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### 동작 흐름

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 브라우저가 HTML 요청                                       │
│ 2. 서버: 빈 HTML 반환 (즉시)                                  │
│ 3. 브라우저: JS 다운로드 & 실행                               │
│ 4. React 컴포넌트 마운트 → useQuery 실행                      │
│ 5. isLoading=true → 스피너 표시                              │
│ 6. API 호출 완료 → data 업데이트 → 리렌더링                   │
└─────────────────────────────────────────────────────────────┘
```

### 결과

| 지표        | 값                       |
| ----------- | ------------------------ |
| TTFB        | 빠름 (빈 HTML)           |
| FCP         | 느림 (JS 로드 후)        |
| SEO         | ❌ 불리                  |
| 사용 케이스 | 대시보드, 인증 후 페이지 |

**면접 포인트:**

- `isLoading`과 `isFetching`의 차이
- `isLoading`: 캐시 없이 최초 로딩 중
- `isFetching`: 백그라운드 refetch 포함 모든 로딩 상태

## 3. SSR + Hydration: dehydrate의 마법

### 예제 코드

```typescript
// app/ssr/page.tsx (서버 컴포넌트)
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';
import { postsQueryOptions } from '@/hooks/usePosts';
import SSRPostList from './SSRPostList';

export default async function SSRPage() {
  const queryClient = getQueryClient();

  // 서버에서 데이터 prefetch (페이지 렌더링 차단)
  await queryClient.prefetchQuery(postsQueryOptions(1500));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SSRPostList />
    </HydrationBoundary>
  );
}
```

```typescript
// app/ssr/SSRPostList.tsx (클라이언트 컴포넌트)
'use client';

import { usePosts } from '@/hooks/usePosts';

export default function SSRPostList() {
  // 캐시에서 데이터를 즉시 가져옴 - isLoading은 false로 시작
  const { data, isLoading } = usePosts(1500);

  if (isLoading) return null; // 실제로는 거의 실행되지 않음

  return (
    <ul>
      {data?.posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Hydration 동작 원리

```
┌─────────────────────────────────────────────────────────────┐
│ 서버 측                                                      │
├─────────────────────────────────────────────────────────────┤
│ 1. prefetchQuery() 실행 → QueryClient 캐시에 데이터 저장     │
│ 2. dehydrate(queryClient) → 캐시를 직렬화된 JSON으로 변환    │
│ 3. HTML + 직렬화된 state를 클라이언트에 전송                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 클라이언트 측                                                │
├─────────────────────────────────────────────────────────────┤
│ 4. HydrationBoundary가 직렬화된 state를 파싱                │
│ 5. 클라이언트 QueryClient 캐시에 복원                        │
│ 6. useQuery 호출 시 캐시 히트 → 즉시 데이터 반환            │
│ 7. staleTime 내라면 refetch 하지 않음                       │
└─────────────────────────────────────────────────────────────┘
```

### 결과

| 지표        | 값                               |
| ----------- | -------------------------------- |
| TTFB        | 느림 (데이터 fetch 대기)         |
| FCP         | 빠름 (완성된 HTML)               |
| SEO         | ✅ 유리                          |
| 사용 케이스 | 블로그, 상품 페이지, 공개 페이지 |

**면접 포인트:**

- `dehydrate()`: QueryClient 캐시 → JSON 직렬화
- `HydrationBoundary`: JSON → QueryClient 캐시 복원
- `queryKey`가 일치해야 캐시 히트 발생

## 4. Streaming: useSuspenseQuery의 진가

### 예제 코드

```typescript
// app/streaming/page.tsx (서버 컴포넌트)
import { Suspense } from 'react';

export default function StreamingPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PostListWithData />
    </Suspense>
  );
}

async function PostListWithData() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(postsQueryOptions(2000));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StreamingPostList />
    </HydrationBoundary>
  );
}
```

```typescript
// app/streaming/StreamingPostList.tsx
'use client';

import { usePostsSuspense } from '@/hooks/usePosts';

export default function StreamingPostList() {
  // useSuspenseQuery: data는 항상 존재함을 보장
  const { data } = usePostsSuspense(2000);

  return (
    <ul>
      {data.posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### 동작 흐름

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 브라우저가 HTML 요청                                      │
│ 2. 서버: Suspense fallback(스켈레톤)을 포함한 HTML 즉시 전송 │
│ 3. 브라우저: 스켈레톤 렌더링 (TTFB 빠름)                     │
│ 4. 서버: 데이터 fetch 완료 후 HTML 청크 스트리밍             │
│ 5. 브라우저: Suspense boundary가 스켈레톤을 실제 콘텐츠로 교체│
│ 6. JavaScript hydration 완료 → 인터랙티브                   │
└─────────────────────────────────────────────────────────────┘
```

### 결과

| 지표        | 값                              |
| ----------- | ------------------------------- |
| TTFB        | 빠름 (스켈레톤 먼저)            |
| FCP         | 빠름 (스켈레톤 표시)            |
| SEO         | ✅ 유리                         |
| 사용 케이스 | 복잡한 페이지, 다중 데이터 소스 |

**면접 포인트:**

- Streaming은 **점진적 렌더링**
- 사용자는 스켈레톤을 먼저 보고, 데이터가 준비되면 교체됨
- 여러 Suspense boundary로 독립적인 로딩 상태 관리 가능

## 5. useQuery vs useSuspenseQuery

### 핵심 차이

```typescript
// useQuery: 명시적 상태 관리
const { data, isLoading, error } = useQuery(options);
// data: T | undefined
// isLoading/error 직접 처리 필요

// useSuspenseQuery: 선언적 상태 관리
const { data } = useSuspenseQuery(options);
// data: T (undefined 절대 아님)
// 로딩/에러는 Suspense/ErrorBoundary가 처리
```

### 동작 방식 비교

| 상황           | useQuery               | useSuspenseQuery |
| -------------- | ---------------------- | ---------------- |
| 데이터 로딩 중 | `isLoading=true` 반환  | Promise를 throw  |
| 에러 발생      | `error` 객체 반환      | Error를 throw    |
| 데이터 존재    | `data` 반환            | `data` 반환      |
| 타입           | `data: T \| undefined` | `data: T`        |

### useSuspenseQuery가 Promise를 throw하는 이유

```typescript
// 내부 동작 (간략화)
function useSuspenseQuery(options) {
  const query = useQuery(options);

  if (query.isLoading) {
    // React가 이 Promise를 catch → Suspense fallback 렌더링
    throw query.promise;
  }

  if (query.error) {
    // React가 이 Error를 catch → ErrorBoundary 렌더링
    throw query.error;
  }

  return { data: query.data }; // 항상 존재
}
```

**면접 포인트:**

- useSuspenseQuery는 React 18+ Suspense와 완벽 호환
- 컴포넌트 내부 조건문 제거 → 코드 단순화
- TypeScript에서 `data`가 optional이 아님

## 6. 면접 예상 질문 & 모범 답안

### Q1. "SSR에서 prefetchQuery를 사용하는 이유는?"

**모범 답안:**

> prefetchQuery는 서버에서 데이터를 미리 가져와 QueryClient 캐시에 저장합니다. 이 캐시를 dehydrate()로 직렬화하여 클라이언트에 전달하면, 클라이언트에서 useQuery 호출 시 API 요청 없이 캐시된 데이터를 즉시 사용할 수 있습니다. 이를 통해 초기 렌더링 시 로딩 상태 없이 완성된 UI를 보여줄 수 있습니다.

### Q2. "useQuery와 useSuspenseQuery 중 어떤 상황에서 무엇을 선택하나요?"

**모범 답안:**

> **useQuery**는 로딩/에러 상태를 컴포넌트 내부에서 직접 처리해야 할 때 사용합니다. 예를 들어, 로딩 중에도 다른 UI 요소를 표시하거나 에러 시 재시도 버튼을 같은 컴포넌트에서 렌더링할 때 적합합니다.
>
> **useSuspenseQuery**는 React Suspense와 ErrorBoundary를 활용해 선언적으로 상태를 관리할 때 사용합니다. 컴포넌트는 데이터가 있다고 가정하고 렌더링 로직만 담당하므로 코드가 단순해집니다. 특히 Streaming SSR에서는 Suspense fallback이 먼저 렌더링되고, 데이터가 준비되면 실제 콘텐츠로 교체되는 점진적 렌더링이 가능합니다.

### Q3. "CSR, SSR, Streaming 중 어떤 상황에서 무엇을 선택하나요?"

**모범 답안:**

| 상황                      | 선택      | 이유                                     |
| ------------------------- | --------- | ---------------------------------------- |
| 대시보드, 실시간 데이터   | CSR       | 자주 변경되므로 서버 렌더링 비용이 낭비  |
| 블로그, 상품 상세         | SSR       | SEO 필수, 데이터가 비교적 정적           |
| 복잡한 페이지 (여러 섹션) | Streaming | 독립적인 Suspense boundary로 점진적 로딩 |
| 인증 후 페이지            | CSR       | 사용자별 데이터이므로 서버 캐싱 불가     |

### Q4. "서버에서 매번 새로운 QueryClient를 생성하는 이유는?"

**모범 답안:**

> 서버에서 QueryClient를 싱글톤으로 사용하면 모든 요청이 같은 캐시를 공유합니다. 이는 A 사용자가 요청한 민감한 데이터가 B 사용자에게 노출될 수 있는 **심각한 보안 취약점**입니다. 따라서 서버에서는 요청마다 새로운 QueryClient 인스턴스를 생성하여 사용자 간 데이터를 격리해야 합니다.

### Q5. "staleTime을 0으로 설정하면 어떤 일이 발생하나요?"

**모범 답안:**

> staleTime이 0이면 데이터는 fetch 직후 즉시 stale 상태가 됩니다. 따라서 같은 쿼리를 호출할 때마다 캐시된 데이터를 반환하면서 **동시에 백그라운드 refetch**가 발생합니다. SSR에서 이 설정을 사용하면 hydration 직후 클라이언트에서 불필요한 API 요청이 발생할 수 있으므로, SSR 환경에서는 적절한 staleTime 설정이 필요합니다.

## 마무리: 핵심 요약 체크리스트

면접 전 최종 점검용:

- [ ] **QueryClient 분리**: 서버는 요청마다 새로 생성, 클라이언트는 싱글톤
- [ ] **dehydrate/HydrationBoundary**: 서버 캐시를 클라이언트로 전달하는 메커니즘
- [ ] **useQuery**: `data | undefined`, 명시적 상태 처리
- [ ] **useSuspenseQuery**: `data` 보장, Suspense와 연동
- [ ] **staleTime**: 데이터 신선도 (0이면 항상 stale)
- [ ] **gcTime**: 미사용 캐시 유지 시간 (기본 5분)
- [ ] **CSR**: 빠른 TTFB, 느린 FCP, SEO 불리
- [ ] **SSR**: 느린 TTFB, 빠른 FCP, SEO 유리
- [ ] **Streaming**: 빠른 TTFB, 점진적 렌더링, SEO 유리

## 참고 자료

- [TanStack Query 공식 문서 - SSR](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [Next.js App Router - Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [React Suspense for Data Fetching](https://react.dev/reference/react/Suspense)
# my-tanstack-query-strategy
