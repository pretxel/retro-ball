'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';

export async function setVotesPerUser(args: { participantId: string; n: number }): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase.rpc('set_votes_per_user', {
    p_participant_id: args.participantId, p_n: args.n,
  });
  if (error) throw new RpcError(extractCode(error.message), error.message);
}
