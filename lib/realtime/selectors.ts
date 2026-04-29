import type { Card, Vote } from './reducer';

export function selectVoteTallies(votes: Vote[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of votes) out[v.card_id] = (out[v.card_id] ?? 0) + 1;
  return out;
}

export function selectMyVoteCount(votes: Vote[], voterId: string): number {
  let n = 0;
  for (const v of votes) if (v.voter_id === voterId) n++;
  return n;
}

export function selectCardsByColumn(cards: Card[]): Record<'mad' | 'sad' | 'glad', Card[]> {
  const out = { mad: [] as Card[], sad: [] as Card[], glad: [] as Card[] };
  for (const c of cards) {
    if (c.column_key === 'mad' || c.column_key === 'sad' || c.column_key === 'glad') out[c.column_key].push(c);
  }
  for (const k of ['mad', 'sad', 'glad'] as const) out[k].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return out;
}
