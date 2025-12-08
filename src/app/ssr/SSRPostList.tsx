'use client';

import { usePosts } from '@/hooks/usePosts';

export default function SSRPostList() {
  // 서버에서 이미 prefetch했으므로 isLoading이 false로 시작
  const { data, isLoading, error } = usePosts(1500);

  // SSR에서는 이 로딩 상태가 보이지 않음 (이미 데이터가 있음)
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p>데이터를 가져오는 중...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">에러가 발생했습니다.</div>;
  }

  return (
    <div>
      <ul className="space-y-3">
        {data?.posts.map((post) => (
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
      {data && (
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
          <p>데이터 수신 시각: {data.meta.fetchedAt}</p>
          <p>총 {data.meta.totalCount}개의 포스트</p>
          <p className="text-green-600 dark:text-green-400 mt-1">
            ✓ 서버에서 prefetch된 데이터입니다
          </p>
        </div>
      )}
    </div>
  );
}
