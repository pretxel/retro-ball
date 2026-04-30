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
    <>
      <Button size="sm" variant="destructive" onClick={click}>End retro</Button>
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </>
  );
}
