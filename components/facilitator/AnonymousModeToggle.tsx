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

  useEffect(() => { setOptimistic(serverValue); }, [serverValue]);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    setOptimistic(next);
    setError(null);
    try { await setAnonymousMode({ participantId, on: next }); }
    catch (err) {
      setOptimistic(!next);
      setError(toToast((err as { code?: string }).code));
    }
  };
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-[var(--ink)]">
        <input
          type="checkbox"
          checked={optimistic}
          onChange={onChange}
          className="riso-check"
        />
        <span>Anonymous cards</span>
      </label>
      {error && <p role="alert" className="text-xs text-[var(--accent)] italic ml-8">{error}</p>}
    </div>
  );
}
