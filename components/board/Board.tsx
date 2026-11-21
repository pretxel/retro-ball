'use client';
import Link from 'next/link';
import { useRoomChannel } from '@/lib/realtime/useRoomChannel';
import { useRoomState } from '@/lib/realtime/useRoomState';
import { Column } from './Column';
import { Timer } from './Timer';
import { TimerControls } from '@/components/facilitator/TimerControls';
import { ParticipantsList } from './ParticipantsList';
import { FacilitatorPanel } from '@/components/facilitator/FacilitatorPanel';

const TITLES = { mad: 'Mad', sad: 'Sad', glad: 'Glad' } as const;

export function Board({ roomId, viewerId }: { roomId: string; viewerId: string }) {
  useRoomChannel(roomId, viewerId);
  const { room, cardsByColumn } = useRoomState();

  if (!room) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="riso-caps text-sm text-[var(--ink)]">Loading the press&hellip;</p>
      </main>
    );
  }

  if (room.ended_at) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="riso-panel max-w-lg text-center px-10 py-12 relative">
          <span className="riso-stamp">FIN</span>
          <p className="riso-caps text-[0.7rem] text-[var(--accent)] mb-3">Closing time</p>
          <h2 className="riso-display text-4xl md:text-5xl mb-4">This retro has ended</h2>
          <p className="text-sm italic mb-6 text-[color-mix(in_oklab,var(--ink)_70%,transparent)]">
            The room is closed. Thanks for showing up honestly.
          </p>
          <Link
            className="btn-riso"
            href="/"
          >
            Start a new one
          </Link>
        </div>
      </main>
    );
  }

  const isFacilitator = room.facilitator_id === viewerId;

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b-2 border-[var(--ink)] pb-6">
        <div className="flex flex-col">
          <p className="riso-caps text-[0.7rem] text-[var(--accent)] mb-1">Room in session</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="riso-display text-2xl md:text-3xl">Retro Ball</span>
            <span className="text-[color-mix(in_oklab,var(--ink)_50%,transparent)]">/</span>
            <span className="riso-mono text-3xl md:text-5xl font-bold text-[var(--accent)] tracking-[0.18em]">
              {room.code}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Timer />
          <TimerControls participantId={viewerId} isFacilitator={isFacilitator} />
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <section className="grid gap-6 md:grid-cols-3" aria-live="polite">
          {(['mad', 'sad', 'glad'] as const).map((k) => (
            <Column key={k} title={TITLES[k]} columnKey={k} cards={cardsByColumn[k]} viewerId={viewerId} />
          ))}
        </section>
        <aside className="space-y-6">
          <div className="riso-panel px-5 py-5">
            <h3 className="riso-display text-2xl mb-3">Around the table</h3>
            <ParticipantsList />
          </div>
          <FacilitatorPanel participantId={viewerId} />
        </aside>
      </div>
    </main>
  );
}
