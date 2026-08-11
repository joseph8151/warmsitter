"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseAuthEnabled } from "@/lib/supabase/config";

export interface ChatMessage {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string };
}

export interface RoomChannel {
  broadcast: (message: ChatMessage) => void;
  unsubscribe: () => void;
  enabled: boolean;
}

// Subscribe to a room's realtime channel using Supabase Broadcast. Decoupled
// from the DB (works even if Postgres isn't Supabase). When Supabase isn't
// configured, returns a disabled channel and the caller should poll instead.
export function subscribeToRoom(
  roomId: string,
  onMessage: (m: ChatMessage) => void
): RoomChannel {
  if (!isSupabaseAuthEnabled) {
    return { broadcast: () => {}, unsubscribe: () => {}, enabled: false };
  }

  const supabase = getSupabaseBrowserClient();
  const channel = supabase.channel(`room:${roomId}`, {
    config: { broadcast: { self: false } },
  });

  channel
    .on("broadcast", { event: "message" }, (payload: { payload: ChatMessage }) => {
      onMessage(payload.payload);
    })
    .subscribe();

  return {
    broadcast: (message: ChatMessage) => {
      void channel.send({ type: "broadcast", event: "message", payload: message });
    },
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
    enabled: true,
  };
}
