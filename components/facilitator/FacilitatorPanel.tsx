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
    <aside
      className="riso-panel px-5 py-5 space-y-5"
      style={{ boxShadow: '8px 8px 0 0 var(--accent)' }}
    >
      <header className="border-b-2 border-[var(--ink)] pb-3">
        <p className="riso-caps text-[0.65rem] text-[var(--accent)] mb-1">Stamp · Facilitator</p>
        <h3 className="riso-display text-3xl">
          <span className="riso-wavy">Yours to run</span>
        </h3>
      </header>
      <div className="space-y-4">
        <AnonymousModeToggle participantId={participantId} />
        <RevealAuthorsToggle participantId={participantId} />
        <VotesPerUserField participantId={participantId} />
      </div>
      <div className="pt-4 border-t-2 border-dashed border-[var(--ink)]">
        <EndRetroButton participantId={participantId} />
      </div>
    </aside>
  );
}
