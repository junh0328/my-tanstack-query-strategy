'use client';

import { usePostsSuspense } from '@/hooks/usePosts';

export default function StreamingPostList() {
  // useSuspenseQuery 사용
  // - 데이터가 없으면 Promise를 throw하여 가장 가까운 Suspense로 전파
  // - 데이터가 있으면 바로 렌더링
  // - data는 항상 존재 (undefined가 아님)
  const { data } = usePostsSuspense(2000);

  return (
    <div>
      <ul className="space-y-3">
        {data.posts.map((post) => (
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
      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
        <p>데이터 수신 시각: {data.meta.fetchedAt}</p>
        <p>총 {data.meta.totalCount}개의 포스트</p>
        <p className="text-purple-600 dark:text-purple-400 mt-1">
          ✓ Streaming SSR로 전달된 데이터입니다
        </p>
      </div>
    </div>
  );
}
