"use client";

// Catches errors thrown in the root layout itself (where error.tsx can't reach).
// It replaces the whole document, so it renders its own <html>/<body> and uses
// self-contained inline styles (globals.css / component classes may be absent).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          background: "linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 60%, #fff 100%)",
          color: "#0f172a",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #e0f2fe",
            borderRadius: 20,
            boxShadow: "0 4px 24px -6px rgba(2,132,199,0.18)",
            padding: "40px 28px",
            maxWidth: 380,
          }}
        >
          <div style={{ fontSize: 48 }}>☀️</div>
          <h1 style={{ color: "#0369a1", fontSize: 20, margin: "12px 0 6px" }}>
            일시적인 오류가 발생했어요
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 20px" }}>
            잠시 후 다시 시도해 주세요. 문제가 계속되면 새로고침해 주세요.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#0ea5e9",
              color: "#fff",
              border: 0,
              borderRadius: 999,
              padding: "10px 22px",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
          {error?.digest && (
            <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 16 }}>오류 코드: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
