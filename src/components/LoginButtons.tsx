"use client";

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function LoginButtons({ users }: { users: DemoUser[] }) {
  async function login(id: string) {
    await fetch("/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    window.location.href = "/dashboard";
  }

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <button
          key={u.id}
          onClick={() => login(u.id)}
          className="ws-card flex w-full items-center justify-between p-4 text-left hover:bg-sky-50"
        >
          <div>
            <p className="font-bold text-slate-900">{u.name}</p>
            <p className="text-sm text-slate-500">{u.email}</p>
          </div>
          <span className="ws-badge bg-sky-100 text-sky-700">{u.role}</span>
        </button>
      ))}
    </div>
  );
}
