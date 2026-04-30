'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';

export async function revokeVote(args: { participantId: string; cardId: string }): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase.rpc('revoke_vote', {
    p_participant_id: args.participantId, p_card_id: args.cardId,
  });
  if (error) throw new RpcError(extractCode(error), error.message);
}
