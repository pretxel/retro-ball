'use client';
import { Button } from '@/components/ui/button';
import { endRoom } from '@/lib/rpc/endRoom';
import { toToast } from '@/lib/errors';
import { useState } from 'react';

export function EndRetroButton({ participantId }: { participantId: string }) {
  const [error, setError] = useState<string | null>(null);
  const click = async () => {
    if (!confirm('End this retro for everyone?')) return;
    setError(null);
    try { await endRoom({ participantId }); }
    catch (e) { setError(toToast((e as { code?: string }).code)); }
  };
  return (
    <div className="space-y-2">
      <Button variant="destructive" onClick={click} className="w-full">End retro</Button>
      {error && <span role="alert" className="block text-xs text-[var(--accent)] italic">{error}</span>}
    </div>
  );
}
