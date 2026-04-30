'use client';
import { AnonymousModeToggle } from './AnonymousModeToggle';
import { RevealAuthorsToggle } from './RevealAuthorsToggle';
import { VotesPerUserField } from './VotesPerUserField';
import { EndRetroButton } from './EndRetroButton';
import { useRoomState } from '@/lib/realtime/useRoomState';

export function FacilitatorPanel({ participantId }: { participantId: string }) {
  const { room } = useRoomState();
  if (!room || room.facilitator_id !== participantId) return null;
  return (
    <aside className="bg-white rounded-lg shadow-sm p-4 space-y-3">
      <h3 className="font-medium">Facilitator</h3>
      <AnonymousModeToggle participantId={participantId} />
      <RevealAuthorsToggle participantId={participantId} />
      <VotesPerUserField participantId={participantId} />
      <EndRetroButton participantId={participantId} />
    </aside>
  );
}
