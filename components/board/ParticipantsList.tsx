'use client';
import { useRoomState } from '@/lib/realtime/useRoomState';

export function ParticipantsList() {
  const { participants, room } = useRoomState();
  return (
    <ul className="space-y-2">
      {participants.map((p, i) => {
        const isFacilitator = p.id === room?.facilitator_id;
        // Slight per-row baseline rotation for hand-set typesetting feel
        const rot = ((i * 37) % 3) - 1; // -1, 0, or 1 deg
        return (
          <li key={p.id} className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-block w-3 h-3 rounded-full border border-[var(--ink)]"
              style={{
                background: isFacilitator ? 'var(--ink)' : 'var(--sticky-peach)',
                boxShadow: '1.5px 1.5px 0 0 var(--ink)',
              }}
            />
            <span
              className="text-[0.95rem] font-medium text-[var(--ink)]"
              style={{ display: 'inline-block', transform: `rotate(${rot}deg)` }}
            >
              {p.display_name}
            </span>
            {isFacilitator && (
              <span className="text-[var(--accent)] text-base font-bold" aria-label="facilitator" title="facilitator">
                ★
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
