'use client';
import { setAnonymousMode } from '@/lib/rpc/setAnonymousMode';
import { useRoomState } from '@/lib/realtime/useRoomState';
import { toToast } from '@/lib/errors';
import { useState } from 'react';

export function AnonymousModeToggle({ participantId }: { participantId: string }) {
  const { room } = useRoomState();
  const [error, setError] = useState<string | null>(null);
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    try { await setAnonymousMode({ participantId, on: e.target.checked }); }
    catch (err) { setError(toToast((err as { code?: string }).code)); }
  };
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={room?.anonymous_mode ?? false} onChange={onChange} />
      Anonymous cards
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
