import { describe, it, expect } from 'vitest';
import { reducer, initialState, type RoomEvent } from '@/lib/realtime/reducer';

const room = {
  id: 'r', code: '123456', template: 'mad-sad-glad', facilitator_id: 'a',
  anonymous_mode: false, votes_per_user: 5, authors_revealed: false,
  timer_started_at: null, timer_seconds: null, ended_at: null,
  created_at: '', last_activity_at: '',
} as const;

describe('reducer', () => {
  it('snapshot seeds state', () => {
    const s = reducer(initialState, { kind: 'snapshot', room, participants: [], cards: [], votes: [] });
    expect(s.room?.id).toBe('r');
  });

  it('card insert appends', () => {
    const s1 = reducer(initialState, { kind: 'snapshot', room, participants: [], cards: [], votes: [] });
    const card = { id: 'c1', room_id: 'r', column_key: 'mad', author_id: 'a', body: 'x', created_at: '', updated_at: '' };
    const s2 = reducer(s1, { kind: 'card_insert', card });
    expect(s2.cards).toHaveLength(1);
    expect(s2.cards[0].id).toBe('c1');
  });

  it('vote tally', () => {
    const card = { id: 'c1', room_id: 'r', column_key: 'mad', author_id: 'a', body: 'x', created_at: '', updated_at: '' };
    const events: RoomEvent[] = [
      { kind: 'snapshot', room, participants: [], cards: [card], votes: [] },
      { kind: 'vote_insert', vote: { id: 'v1', room_id: 'r', card_id: 'c1', voter_id: 'a', created_at: '' } },
      { kind: 'vote_insert', vote: { id: 'v2', room_id: 'r', card_id: 'c1', voter_id: 'a', created_at: '' } },
    ];
    const s = events.reduce(reducer, initialState);
    expect(s.votes.length).toBe(2);
  });
});
