'use client';
import { useState } from 'react';
import { Card } from './Card';
import { CardEditor } from './CardEditor';
import type { Card as CardRow } from '@/lib/realtime/reducer';

type ColumnKey = 'mad' | 'sad' | 'glad';

const COLUMN_STYLES: Record<ColumnKey, { titleColor: string; eyebrow: string; strike?: boolean }> = {
  mad: { titleColor: 'var(--accent)', eyebrow: 'What burns' },
  sad: { titleColor: 'var(--ink)', eyebrow: 'What stings' },
  glad: { titleColor: 'var(--ink)', eyebrow: 'What sings', strike: true },
};

export function Column({
  title,
  columnKey,
  cards,
  viewerId,
}: {
  title: string;
  columnKey: ColumnKey;
  cards: CardRow[];
  viewerId: string;
}) {
  const [adding, setAdding] = useState(false);
  const cfg = COLUMN_STYLES[columnKey];

  return (
    <section className="flex flex-col gap-4">
      <header className="pb-2">
        <p className="riso-caps text-[0.65rem] text-[color-mix(in_oklab,var(--ink)_55%,transparent)] mb-1">
          {cfg.eyebrow}
        </p>
        <h2
          className="riso-display text-5xl md:text-6xl leading-[0.85] tracking-[-0.04em]"
          style={{ color: cfg.titleColor, fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}
        >
          {cfg.strike ? <span className="riso-strike">{title}</span> : title}
        </h2>
      </header>

      <ul className="flex flex-col gap-5">
        {adding && (
          <li>
            <div className="riso-panel px-4 py-4">
              <CardEditor
                participantId={viewerId}
                mode={{ kind: 'add', columnKey }}
                onClose={() => setAdding(false)}
              />
            </div>
          </li>
        )}
        {cards.map((c, idx) => (
          <li key={c.id}>
            <Card card={c} viewerId={viewerId} index={idx} />
          </li>
        ))}
        {!adding && (
          <li>
            <button
              type="button"
              className="riso-add-btn"
              onClick={() => setAdding(true)}
              aria-label={`Add card to ${title}`}
            >
              + Add card
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}
