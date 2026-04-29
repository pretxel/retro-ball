import { describe, it, expect } from 'vitest';
import { selectVoteTallies, selectMyVoteCount, selectCardsByColumn } from '@/lib/realtime/selectors';

const cards = [
  { id: 'c1', room_id: 'r', column_key: 'mad', author_id: 'a', body: 'x', created_at: '1', updated_at: '1' },
  { id: 'c2', room_id: 'r', column_key: 'glad', author_id: 'b', body: 'y', created_at: '2', updated_at: '2' },
];
const votes = [
  { id: 'v1', room_id: 'r', card_id: 'c1', voter_id: 'a', created_at: '' },
  { id: 'v2', room_id: 'r', card_id: 'c1', voter_id: 'a', created_at: '' },
  { id: 'v3', room_id: 'r', card_id: 'c2', voter_id: 'b', created_at: '' },
];

describe('selectors', () => {
  it('vote tallies per card', () => {
    expect(selectVoteTallies(votes as never)).toEqual({ c1: 2, c2: 1 });
  });
  it('my vote count', () => {
    expect(selectMyVoteCount(votes as never, 'a')).toBe(2);
  });
  it('cards by column', () => {
    expect(selectCardsByColumn(cards as never).mad.length).toBe(1);
    expect(selectCardsByColumn(cards as never).glad.length).toBe(1);
    expect(selectCardsByColumn(cards as never).sad.length).toBe(0);
  });
});
