'use client';
import { useRoomStore } from './store';
import { selectCardsByColumn, selectMyVoteCount, selectVoteTallies } from './selectors';

export function useRoomState() {
  const room = useRoomStore((s) => s.room);
  const participants = useRoomStore((s) => s.participants);
  const cards = useRoomStore((s) => s.cards);
  const votes = useRoomStore((s) => s.votes);
  return {
    room,
    participants,
    cards,
    votes,
    cardsByColumn: selectCardsByColumn(cards),
    voteTallies: selectVoteTallies(votes),
    myVoteCount: (myId: string) => selectMyVoteCount(votes, myId),
  };
}
