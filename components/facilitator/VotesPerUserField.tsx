'use client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setVotesPerUser } from '@/lib/rpc/setVotesPerUser';
import { useRoomState } from '@/lib/realtime/useRoomState';
import { toToast } from '@/lib/errors';
import { useState } from 'react';

export function VotesPerUserField({ participantId }: { participantId: string }) {
  const { room } = useRoomState();
  const [error, setError] = useState<string | null>(null);
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    if (!Number.isFinite(n) || n < 1 || n > 20) return;
    setError(null);
    try { await setVotesPerUser({ participantId, n }); }
    catch (err) { setError(toToast((err as { code?: string }).code)); }
  };
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="vpu">Votes / user</Label>
        <Input
          id="vpu"
          type="number"
          min={1}
          max={20}
          defaultValue={room?.votes_per_user ?? 5}
          onBlur={onChange}
          className="riso-mono w-20 text-center text-base font-bold"
        />
      </div>
      {error && <span role="alert" className="block text-xs text-[var(--accent)] italic">{error}</span>}
    </div>
  );
}
