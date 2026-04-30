'use client';
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

  if (!room) return <div className="p-6">Loading…</div>;
  if (room.ended_at) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">This retro has ended</h2>
          <a className="underline" href="/">Start a new one</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 bg-zinc-50">
      <header className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold">Room {room.code}</h1>
        <div className="flex items-center gap-3">
          <Timer />
          <TimerControls participantId={viewerId} isFacilitator={room.facilitator_id === viewerId} />
        </div>
      </header>
      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <section className="grid gap-4 md:grid-cols-3" aria-live="polite">
          {(['mad', 'sad', 'glad'] as const).map((k) => (
            <Column key={k} title={TITLES[k]} columnKey={k} cards={cardsByColumn[k]} viewerId={viewerId} />
          ))}
        </section>
        <aside className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-medium mb-2">Participants</h3>
            <ParticipantsList />
          </div>
          <FacilitatorPanel participantId={viewerId} />
        </aside>
      </div>
    </main>
  );
}
