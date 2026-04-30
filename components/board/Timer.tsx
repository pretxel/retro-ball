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

  if (!room?.timer_started_at || !room.timer_seconds) {
    return (
      <span
        className="riso-display text-3xl md:text-4xl text-[color-mix(in_oklab,var(--ink)_50%,transparent)]"
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}
      >
        0:00
      </span>
    );
  }
  const startedMs = new Date(room.timer_started_at).getTime();
  const remaining = Math.max(0, Math.floor((startedMs + room.timer_seconds * 1000 - now) / 1000));
  const m = Math.floor(remaining / 60).toString();
  const s = (remaining % 60).toString().padStart(2, '0');
  const isUrgent = remaining < 30;

  return (
    <span
      className={`riso-mono riso-timer-running text-3xl md:text-5xl font-bold tracking-[0.1em] ${isUrgent ? 'text-[var(--accent)]' : 'text-[var(--ink)]'}`}
      aria-live="polite"
    >
      {m}:{s}
    </span>
  );
}
