'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardEditor } from './CardEditor';
import { castVote } from '@/lib/rpc/castVote';
import { revokeVote } from '@/lib/rpc/revokeVote';
import { deleteCard } from '@/lib/rpc/deleteCard';
import { useRoomState } from '@/lib/realtime/useRoomState';
import { toToast } from '@/lib/errors';
import type { Card as CardRow } from '@/lib/realtime/reducer';

export function Card({ card, viewerId }: { card: CardRow; viewerId: string }) {
  const { room, participants, votes, voteTallies } = useRoomState();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMine = card.author_id === viewerId;
  const isFacilitator = room?.facilitator_id === viewerId;
  const myVotesOnCard = votes.filter((v) => v.voter_id === viewerId && v.card_id === card.id).length;
  const total = voteTallies[card.id] ?? 0;
  const author = participants.find((p) => p.id === card.author_id);
  const showAuthor =
    !room?.anonymous_mode ||
    room.authors_revealed;
  // In anonymous mode the author sees "You" on their own card rather than their display name,
  // keeping the anonymous aesthetic consistent while still distinguishing ownership.
  const authorName = showAuthor
    ? author?.display_name ?? '—'
    : isMine
      ? 'You'
      : 'Anonymous';

  const onVote = async () => {
    setError(null);
    try { await castVote({ participantId: viewerId, cardId: card.id }); }
    catch (e) { setError(toToast((e as { code?: string }).code)); }
  };
  const onUnvote = async () => {
    setError(null);
    try { await revokeVote({ participantId: viewerId, cardId: card.id }); }
    catch (e) { setError(toToast((e as { code?: string }).code)); }
  };
  const onDelete = async () => {
    if (!confirm('Delete this card?')) return;
    setError(null);
    try { await deleteCard({ participantId: viewerId, cardId: card.id }); }
    catch (e) { setError(toToast((e as { code?: string }).code)); }
  };

  if (editing) {
    return <li className="border rounded p-2 text-sm bg-white"><CardEditor participantId={viewerId} mode={{ kind: 'edit', cardId: card.id, initial: card.body }} onClose={() => setEditing(false)} /></li>;
  }

  return (
    <li className="border rounded p-2 text-sm bg-white">
      <p className="whitespace-pre-wrap">{card.body}</p>
      <p className="text-xs text-zinc-500 mt-1">{authorName}</p>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={onVote} aria-label="Add vote">+1</Button>
        <Button size="sm" variant="ghost" onClick={onUnvote} disabled={myVotesOnCard === 0} aria-label="Remove vote">-1</Button>
        <span role="status" className="text-xs text-zinc-600" aria-label="Vote total">{total} votes</span>
        {isMine && <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>}
        {(isMine || isFacilitator) && <Button size="sm" variant="ghost" onClick={onDelete}>Delete</Button>}
      </div>
      {error && <p role="alert" className="text-xs text-red-600 mt-1">{error}</p>}
    </li>
  );
}
