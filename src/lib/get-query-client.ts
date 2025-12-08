import { QueryClient, isServer } from '@tanstack/react-query';

/**
 * QueryClient 생성 함수
 *
 * 이 함수는 서버와 클라이언트 모두에서 사용됩니다.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 60초 동안 데이터를 fresh로 유지
        staleTime: 60 * 1000,
        // 윈도우 포커스 시 자동 refetch 비활성화 (데모용)
        refetchOnWindowFocus: false,
        // 실패 시 1번만 재시도
        retry: 1,
      },
    },
  });
}

// 브라우저 환경에서만 사용되는 싱글톤
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * 환경에 따라 적절한 QueryClient를 반환
 *
 * 핵심 원리:
 * 1. 서버 (isServer === true)
 *    - 매 요청마다 새로운 QueryClient 생성
 *    - 이유: 서버는 여러 사용자의 요청을 처리하므로 데이터가 섞이면 안 됨
 *
 * 2. 클라이언트 (브라우저)
 *    - 최초 1회만 생성 후 재사용 (싱글톤)
 *    - 이유: 클라이언트는 한 사용자만 사용하므로 상태를 유지해야 함
 */
export function getQueryClient() {
  if (isServer) {
    // 서버: 항상 새로운 QueryClient 반환
    return makeQueryClient();
  }

  // 브라우저: 싱글톤 패턴
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
