'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';
import type { Card } from '@/lib/realtime/reducer';

export async function editCard(args: { participantId: string; cardId: string; body: string }): Promise<Card> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase.rpc('rb_edit_card', {
    p_participant_id: args.participantId,
    p_card_id: args.cardId,
    p_body: args.body,
  });
  if (error) throw new RpcError(extractCode(error), error.message);
  return data as Card;
}
