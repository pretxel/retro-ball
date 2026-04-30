'use client';
import { useRoomState } from '@/lib/realtime/useRoomState';

export function ParticipantsList() {
  const { participants, room } = useRoomState();
  return (
    <ul className="text-sm space-y-1">
      {participants.map((p) => (
        <li key={p.id} className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${p.id === room?.facilitator_id ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span>{p.display_name}{p.id === room?.facilitator_id && ' · facilitator'}</span>
        </li>
      ))}
    </ul>
  );
}
