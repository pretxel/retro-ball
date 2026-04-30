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
  if (room.authors_revealed) return <span className="text-sm text-zinc-500">Authors revealed</span>;
  return (
    <>
      <Button size="sm" variant="outline" onClick={reveal}>Reveal authors</Button>
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </>
  );
}
