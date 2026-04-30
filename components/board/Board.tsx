'use client';
import { useRoomChannel } from '@/lib/realtime/useRoomChannel';
import { useRoomState } from '@/lib/realtime/useRoomState';
import { Column } from './Column';

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
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Room {room.code}</h1>
      </header>
      <section className="grid gap-4 md:grid-cols-3" aria-live="polite">
        {(['mad', 'sad', 'glad'] as const).map((k) => (
          <Column key={k} title={TITLES[k]} columnKey={k} cards={cardsByColumn[k]} viewerId={viewerId} />
        ))}
      </section>
    </main>
  );
}
