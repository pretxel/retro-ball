import type { Database } from '@/lib/supabase/types';

export type Room = Database['public']['Tables']['rb_rooms']['Row'];
export type Participant = Database['public']['Tables']['rb_participants']['Row'];
export type Card = Database['public']['Tables']['rb_cards']['Row'];
export type Vote = Database['public']['Tables']['rb_votes']['Row'];

export type RoomState = {
  room: Room | null;
  participants: Participant[];
  cards: Card[];
  votes: Vote[];
};

export const initialState: RoomState = {
  room: null,
  participants: [],
  cards: [],
  votes: [],
};

export type RoomEvent =
  | { kind: 'snapshot'; room: Room; participants: Participant[]; cards: Card[]; votes: Vote[] }
  | { kind: 'room_update'; room: Room }
  | { kind: 'participant_insert'; participant: Participant }
  | { kind: 'participant_update'; participant: Participant }
  | { kind: 'participant_delete'; id: string }
  | { kind: 'card_insert'; card: Card }
  | { kind: 'card_update'; card: Card }
  | { kind: 'card_delete'; id: string }
  | { kind: 'vote_insert'; vote: Vote }
  | { kind: 'vote_delete'; id: string };

export function reducer(s: RoomState, e: RoomEvent): RoomState {
  switch (e.kind) {
    case 'snapshot':
      return { room: e.room, participants: e.participants, cards: e.cards, votes: e.votes };
    case 'room_update':
      return { ...s, room: e.room };
    case 'participant_insert':
      return s.participants.find((p) => p.id === e.participant.id)
        ? s
        : { ...s, participants: [...s.participants, e.participant] };
    case 'participant_update':
      return { ...s, participants: s.participants.map((p) => (p.id === e.participant.id ? e.participant : p)) };
    case 'participant_delete':
      return { ...s, participants: s.participants.filter((p) => p.id !== e.id) };
    case 'card_insert':
      return s.cards.find((c) => c.id === e.card.id) ? s : { ...s, cards: [...s.cards, e.card] };
    case 'card_update':
      return { ...s, cards: s.cards.map((c) => (c.id === e.card.id ? e.card : c)) };
    case 'card_delete':
      return { ...s, cards: s.cards.filter((c) => c.id !== e.id) };
    case 'vote_insert':
      return s.votes.find((v) => v.id === e.vote.id) ? s : { ...s, votes: [...s.votes, e.vote] };
    case 'vote_delete':
      return { ...s, votes: s.votes.filter((v) => v.id !== e.id) };
  }
}
