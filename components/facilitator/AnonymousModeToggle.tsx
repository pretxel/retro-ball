'use client';
import { setAnonymousMode } from '@/lib/rpc/setAnonymousMode';
import { useRoomState } from '@/lib/realtime/useRoomState';
import { toToast } from '@/lib/errors';
import { useEffect, useState } from 'react';

export function AnonymousModeToggle({ participantId }: { participantId: string }) {
  const { room } = useRoomState();
  const serverValue = room?.anonymous_mode ?? false;
  const [optimistic, setOptimistic] = useState(serverValue);
  const [error, setError] = useState<string | null>(null);

  // Keep optimistic state in sync with server once realtime arrives
  useEffect(() => { setOptimistic(serverValue); }, [serverValue]);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setOptimistic(next); // immediate feedback so controlled input reflects the click
    setError(null);
    try { await setAnonymousMode({ participantId, on: next }); }
    catch (err) {
      setOptimistic(!next); // revert on failure
      setError(toToast((err as { code?: string }).code));
    }
  };
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={optimistic} onChange={onChange} />
      Anonymous cards
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
