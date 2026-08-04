"use client";

import { useEffect } from "react";

// App-level error boundary (App Router). Client component with a reset action.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md pt-16 text-center">
      <div className="ws-card p-10">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-sky-100 text-4xl">😵</div>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-900">문제가 발생했어요</h1>
        <p className="mt-2 text-slate-600">일시적인 오류일 수 있어요. 다시 시도해 주세요.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="ws-btn-primary">다시 시도</button>
          <a href="/" className="ws-btn-ghost">홈으로</a>
        </div>
      </div>
    </div>
  );
}
