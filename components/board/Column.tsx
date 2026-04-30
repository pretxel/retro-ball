'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from './Card';
import { CardEditor } from './CardEditor';
import type { Card as CardRow } from '@/lib/realtime/reducer';

export function Column({
  title,
  columnKey,
  cards,
  viewerId,
}: {
  title: string;
  columnKey: 'mad' | 'sad' | 'glad';
  cards: CardRow[];
  viewerId: string;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <header className="flex items-center justify-between mb-2">
        <h2 className="font-medium">{title}</h2>
        <Button size="sm" onClick={() => setAdding(true)} aria-label={`Add card to ${title}`}>+ Card</Button>
      </header>
      <ul className="space-y-2">
        {adding && (
          <li className="border rounded p-2 text-sm bg-white">
            <CardEditor participantId={viewerId} mode={{ kind: 'add', columnKey }} onClose={() => setAdding(false)} />
          </li>
        )}
        {cards.map((c) => <Card key={c.id} card={c} viewerId={viewerId} />)}
      </ul>
    </div>
  );
}
