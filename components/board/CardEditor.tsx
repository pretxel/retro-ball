'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addCard } from '@/lib/rpc/addCard';
import { editCard } from '@/lib/rpc/editCard';
import { toToast } from '@/lib/errors';

type Mode = { kind: 'add'; columnKey: 'mad' | 'sad' | 'glad' } | { kind: 'edit'; cardId: string; initial: string };

export function CardEditor({ participantId, mode, onClose }: { participantId: string; mode: Mode; onClose: () => void }) {
  const [body, setBody] = useState(mode.kind === 'edit' ? mode.initial : '');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true); setError(null);
    try {
      if (mode.kind === 'add') await addCard({ participantId, columnKey: mode.columnKey, body: body.trim() });
      else await editCard({ participantId, cardId: mode.cardId, body: body.trim() });
      onClose();
    } catch (e) {
      setError(toToast((e as { code?: string }).code));
      setPending(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-2">
      <Input value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} autoFocus />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>Save</Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
