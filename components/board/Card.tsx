'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { CardEditor } from './CardEditor';
import { castVote } from '@/lib/rpc/castVote';
import { revokeVote } from '@/lib/rpc/revokeVote';
import { deleteCard } from '@/lib/rpc/deleteCard';
import { useRoomState } from '@/lib/realtime/useRoomState';
import { toToast } from '@/lib/errors';
import type { Card as CardRow } from '@/lib/realtime/reducer';

const STICKY_TINTS = [
  'var(--sticky-yellow)',
  'var(--sticky-peach)',
  'var(--sticky-mint)',
  'var(--sticky-lavender)',
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Card({ card, viewerId, index = 0 }: { card: CardRow; viewerId: string; index?: number }) {
  const { room, participants, votes, voteTallies } = useRoomState();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMine = card.author_id === viewerId;
  const isFacilitator = room?.facilitator_id === viewerId;
  const myVotesOnCard = votes.filter((v) => v.voter_id === viewerId && v.card_id === card.id).length;
  const total = voteTallies[card.id] ?? 0;
  const author = participants.find((p) => p.id === card.author_id);
  const showAuthor = !room?.anonymous_mode || room.authors_revealed;
  const authorIsAnonymous = !showAuthor && !isMine;
  const authorName = showAuthor
    ? author?.display_name ?? '—'
    : isMine
      ? 'You'
      : 'Anonymous';

  const { tint, rotation } = useMemo(() => {
    const h = hashStr(card.id);
    return {
      tint: STICKY_TINTS[h % STICKY_TINTS.length],
      rotation: ((h % 5) - 2) + (index % 2 === 0 ? 0 : 0.4),
    };
  }, [card.id, index]);

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
    return (
      <div className="riso-panel px-4 py-4">
        <CardEditor
          participantId={viewerId}
          mode={{ kind: 'edit', cardId: card.id, initial: card.body }}
          onClose={() => setEditing(false)}
        />
      </div>
    );
  }

  const stickyStyle: React.CSSProperties = {
    background: tint,
    transform: `rotate(${rotation}deg)`,
    ['--sticky-rot' as string]: `${rotation}deg`,
  };

  return (
    <article className="riso-sticky" style={stickyStyle}>
      <span className="riso-tape" />
      <p className="whitespace-pre-wrap text-[0.95rem] leading-snug font-medium text-[var(--ink)]">
        {card.body}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        {authorIsAnonymous ? (
          <span className="riso-anon text-xs">Anonymous</span>
        ) : (
          <span className="text-[0.7rem] uppercase tracking-[0.14em] font-semibold text-[color-mix(in_oklab,var(--ink)_70%,transparent)]">
            {isMine && room?.anonymous_mode ? 'You' : authorName}
          </span>
        )}

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onVote}
            aria-label="Add vote"
            className="w-8 h-8 inline-flex items-center justify-center border-2 border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] font-bold text-base hover:bg-[var(--accent)] hover:text-[var(--paper)] transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ▲
          </button>
          <span
            role="status"
            aria-label="Vote total"
            className="riso-mono min-w-[2ch] text-center font-bold text-base text-[var(--ink)]"
          >
            {total}
          </span>
          <button
            type="button"
            onClick={onUnvote}
            disabled={myVotesOnCard === 0}
            aria-label="Remove vote"
            className="w-8 h-8 inline-flex items-center justify-center border-2 border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] font-bold text-base hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ▽
          </button>
        </div>
      </div>

      {(isMine || isFacilitator) && (
        <div className="mt-3 flex items-center gap-2 flex-wrap pt-2 border-t border-[color-mix(in_oklab,var(--ink)_25%,transparent)]">
          {isMine && (
            <Button size="xs" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
          {(isMine || isFacilitator) && (
            <Button size="xs" variant="ghost" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-[var(--accent)] italic mt-2">{error}</p>
      )}
    </article>
  );
}
