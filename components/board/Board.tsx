'use client';
import { useRoomChannel } from '@/lib/realtime/useRoomChannel';
import { useRoomState } from '@/lib/realtime/useRoomState';

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
      <section className="grid gap-4 md:grid-cols-3">
        {(['mad', 'sad', 'glad'] as const).map((k) => (
          <div key={k} className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="font-medium capitalize mb-2">{k}</h2>
            <ul className="space-y-2">
              {cardsByColumn[k].map((c) => (
                <li key={c.id} className="border rounded p-2 text-sm">{c.body}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
