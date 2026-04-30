'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';
import type { Card } from '@/lib/realtime/reducer';

export { RpcError };

export async function addCard(args: {
  participantId: string; columnKey: 'mad' | 'sad' | 'glad'; body: string;
}): Promise<Card> {
  const supabase = getBrowserClient();
  const { data, error } = await supabase.rpc('add_card', {
    p_participant_id: args.participantId,
    p_column_key: args.columnKey,
    p_body: args.body,
  });
  if (error) throw new RpcError(extractCode(error), error.message);
  return data as Card;
}
