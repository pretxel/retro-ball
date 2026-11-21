'use client';
import { useEffect } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';
import { useRoomStore } from './store';
import type { Card, Participant, Room, Vote } from './reducer';

export function useRoomChannel(roomId: string | null, viewerId: string | null) {
  const dispatch = useRoomStore((s) => s.dispatch);

  useEffect(() => {
    if (!roomId || !viewerId) return;
    const supabase = getBrowserClient();

    let cancelled = false;

    async function snapshot() {
      const { data, error } = await supabase.rpc('rb_get_room_state', { p_room_id: roomId!, p_viewer_id: viewerId! });
      if (cancelled || error || !data?.[0]?.room) return;
      const row = data[0];
      dispatch({
        kind: 'snapshot',
        room: row.room as Room,
        participants: (row.participants as Participant[]) ?? [],
        cards: (row.cards as Card[]) ?? [],
        votes: (row.votes as Vote[]) ?? [],
      });
    }

    snapshot();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rb_rooms', filter: `id=eq.${roomId}` }, (p) => {
        if (p.eventType === 'UPDATE') dispatch({ kind: 'room_update', room: p.new as Room });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rb_participants', filter: `room_id=eq.${roomId}` }, (p) => {
        if (p.eventType === 'INSERT') dispatch({ kind: 'participant_insert', participant: p.new as Participant });
        else if (p.eventType === 'UPDATE') dispatch({ kind: 'participant_update', participant: p.new as Participant });
        else if (p.eventType === 'DELETE') dispatch({ kind: 'participant_delete', id: (p.old as { id: string }).id });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rb_cards', filter: `room_id=eq.${roomId}` }, (p) => {
        if (p.eventType === 'INSERT') dispatch({ kind: 'card_insert', card: p.new as Card });
        else if (p.eventType === 'UPDATE') dispatch({ kind: 'card_update', card: p.new as Card });
        else if (p.eventType === 'DELETE') dispatch({ kind: 'card_delete', id: (p.old as { id: string }).id });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rb_votes', filter: `room_id=eq.${roomId}` }, (p) => {
        if (p.eventType === 'INSERT') dispatch({ kind: 'vote_insert', vote: p.new as Vote });
        else if (p.eventType === 'DELETE') dispatch({ kind: 'vote_delete', id: (p.old as { id: string }).id });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ participant_id: viewerId });
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          await snapshot(); // refetch on reconnect
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId, viewerId, dispatch]);
}
