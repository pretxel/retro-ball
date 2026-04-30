'use client';
import { useEffect, useState } from 'react';
import { useRoomState } from '@/lib/realtime/useRoomState';

export function Timer() {
  const { room } = useRoomState();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!room?.timer_started_at) return;
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, [room?.timer_started_at]);

  if (!room?.timer_started_at || !room.timer_seconds) return <span className="text-sm text-zinc-500">No timer</span>;
  const startedMs = new Date(room.timer_started_at).getTime();
  const remaining = Math.max(0, Math.floor((startedMs + room.timer_seconds * 1000 - now) / 1000));
  const m = Math.floor(remaining / 60).toString().padStart(2, '0');
  const s = (remaining % 60).toString().padStart(2, '0');
  return <span className="font-mono text-sm" aria-live="polite">{m}:{s}</span>;
}
