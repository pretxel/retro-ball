'use client';
import { Button } from '@/components/ui/button';
import { startTimer } from '@/lib/rpc/startTimer';
import { stopTimer } from '@/lib/rpc/stopTimer';
import { toToast } from '@/lib/errors';
import { useState } from 'react';

export function TimerControls({ participantId, isFacilitator }: { participantId: string; isFacilitator: boolean }) {
  const [error, setError] = useState<string | null>(null);
  if (!isFacilitator) return null;
  const start = async (seconds: number) => {
    setError(null);
    try { await startTimer({ participantId, seconds }); }
    catch (e) { setError(toToast((e as { code?: string }).code)); }
  };
  const stop = async () => {
    setError(null);
    try { await stopTimer({ participantId }); }
    catch (e) { setError(toToast((e as { code?: string }).code)); }
  };
  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <Button size="sm" variant="outline" onClick={() => start(300)}>5m</Button>
      <Button size="sm" variant="outline" onClick={() => start(600)}>10m</Button>
      <Button size="sm" variant="outline" onClick={() => start(900)}>15m</Button>
      <Button size="sm" variant="ghost" onClick={stop}>Stop</Button>
      {error && <span role="alert" className="text-xs text-[var(--accent)] italic">{error}</span>}
    </div>
  );
}
