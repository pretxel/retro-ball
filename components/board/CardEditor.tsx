'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
    <form onSubmit={submit} className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={500}
        autoFocus
        rows={3}
        placeholder={mode.kind === 'add' ? 'What needs to be said?' : 'Revise your card'}
        className="input-riso resize-none"
        style={{ fontFamily: 'var(--font-body)' }}
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>Save</Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
      {error && <p role="alert" className="text-sm text-[var(--accent)] italic">{error}</p>}
    </form>
  );
}
