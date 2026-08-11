import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md pt-16 text-center">
      <div className="ws-card p-10">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-sky-100 text-4xl">🔍</div>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-900">페이지를 찾을 수 없어요</h1>
        <p className="mt-2 text-slate-600">주소가 바뀌었거나 삭제된 페이지일 수 있어요.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="ws-btn-primary">홈으로</Link>
          <Link href="/sitters" className="ws-btn-ghost">시터 찾기</Link>
        </div>
      </div>
    </div>
  );
}
