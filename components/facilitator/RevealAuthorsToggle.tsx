'use client';
import { Button } from '@/components/ui/button';
import { revealAuthors } from '@/lib/rpc/revealAuthors';
import { useRoomState } from '@/lib/realtime/useRoomState';
import { toToast } from '@/lib/errors';
import { useState } from 'react';

export function RevealAuthorsToggle({ participantId }: { participantId: string }) {
  const { room } = useRoomState();
  const [error, setError] = useState<string | null>(null);
  if (!room?.anonymous_mode) return null;
  const reveal = async () => {
    setError(null);
    try { await revealAuthors({ participantId }); }
    catch (e) { setError(toToast((e as { code?: string }).code)); }
  };
  if (room.authors_revealed) {
    return (
      <p className="riso-caps text-xs text-[color-mix(in_oklab,var(--ink)_65%,transparent)]">
        Authors revealed
      </p>
    );
  }
  return (
    <div className="space-y-1">
      <Button size="sm" variant="outline" onClick={reveal}>Reveal authors</Button>
      {error && <span role="alert" className="block text-xs text-[var(--accent)] italic">{error}</span>}
    </div>
  );
}
