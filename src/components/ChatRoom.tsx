"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client/api";
import { subscribeToRoom, type ChatMessage, type RoomChannel } from "@/lib/client/realtime";

// Realtime chat room. Uses Supabase Broadcast when configured; otherwise falls
// back to polling every 4s. Messages are persisted via the REST API either way.
export function ChatRoom({
  roomId,
  currentUserId,
  otherName,
}: {
  roomId: string;
  currentUserId: string;
  otherName: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const channelRef = useRef<RoomChannel | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAtRef = useRef<string | null>(null);

  function ingest(incoming: ChatMessage[]) {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const merged = [...prev];
      for (const m of incoming) if (!seen.has(m.id)) merged.push(m);
      merged.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      lastAtRef.current = merged[merged.length - 1]?.createdAt ?? lastAtRef.current;
      return merged;
    });
  }

  // Initial load + realtime subscription (or polling fallback).
  useEffect(() => {
    let poll: ReturnType<typeof setInterval> | null = null;

    (async () => {
      const res = await api<{ messages: ChatMessage[] }>(`/api/chats/${roomId}/messages`);
      ingest(res.messages);

      const channel = subscribeToRoom(roomId, (m) => ingest([m]));
      channelRef.current = channel;

      if (!channel.enabled) {
        poll = setInterval(async () => {
          const after = lastAtRef.current ? `?after=${encodeURIComponent(lastAtRef.current)}` : "";
          const r = await api<{ messages: ChatMessage[] }>(`/api/chats/${roomId}/messages${after}`);
          ingest(r.messages);
        }, 4000);
      }
    })();

    return () => {
      channelRef.current?.unsubscribe();
      if (poll) clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await api<{ message: ChatMessage }>(`/api/chats/${roomId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      ingest([res.message]);
      channelRef.current?.broadcast(res.message); // realtime fan-out to the other party
      setInput("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="ws-card flex h-[70vh] flex-col overflow-hidden">
      <div className="border-b border-sky-100 bg-white/70 px-4 py-3 font-bold text-slate-900">
        {otherName}님과의 대화
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m) => {
          const mine = m.sender.id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  mine ? "bg-sky-500 text-white" : "bg-sky-50 text-slate-800"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-sky-100 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="메시지를 입력하세요 (일정·시급을 확정해보세요)"
          className="flex-1 rounded-full border border-sky-200 px-4 py-2 text-sm"
        />
        <button onClick={send} disabled={sending} className="ws-btn-primary">
          전송
        </button>
      </div>
    </div>
  );
}
