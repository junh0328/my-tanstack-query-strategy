import { useQuery, useSuspenseQuery, queryOptions, isServer } from '@tanstack/react-query';
import axios from 'axios';

// 응답 타입 정의
export interface Post {
  id: number;
  title: string;
  author: string;
  createdAt: string;
}

export interface PostsResponse {
  posts: Post[];
  meta: {
    fetchedAt: string;
    totalCount: number;
    executedOn: string;
  };
}

// Base URL 결정 (서버에서는 절대 URL 필요)
const getBaseUrl = () => {
  if (isServer) {
    // 서버에서는 절대 URL 사용
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
  }
  // 클라이언트에서는 상대 URL 사용 가능
  return '';
};

// API 함수
export const fetchPosts = async (delay = 1000): Promise<PostsResponse> => {
  const baseUrl = getBaseUrl();
  const response = await axios.get<PostsResponse>(`${baseUrl}/api/posts?delay=${delay}`);
  return response.data;
};

/**
 * queryOptions 패턴
 *
 * TanStack Query v5에서 권장하는 패턴
 * - 서버와 클라이언트에서 동일한 쿼리 키와 함수를 공유
 * - prefetchQuery와 useQuery에서 재사용 가능
 */
export const postsQueryOptions = (delay = 1000) =>
  queryOptions({
    queryKey: ['posts', delay],
    queryFn: () => fetchPosts(delay),
  });

/**
 * CSR용 훅 - useQuery
 *
 * 특징:
 * - 클라이언트에서 컴포넌트 마운트 후 데이터 fetch
 * - isLoading, isError 등의 상태를 직접 처리
 * - 초기 렌더링 시 데이터 없음 (로딩 UI 필요)
 */
export const usePosts = (delay = 1000) => {
  return useQuery(postsQueryOptions(delay));
};

/**
 * SSR/Streaming용 훅 - useSuspenseQuery
 *
 * 특징:
 * - React Suspense와 함께 사용
 * - 데이터가 준비될 때까지 컴포넌트 렌더링을 중단
 * - 반환 타입에서 undefined가 제거됨 (data가 항상 존재)
 * - 로딩 UI는 Suspense fallback에서 처리
 */
export const usePostsSuspense = (delay = 1000) => {
  return useSuspenseQuery(postsQueryOptions(delay));
};
