'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';

export async function startTimer(args: { participantId: string; seconds: number }): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase.rpc('start_timer', {
    p_participant_id: args.participantId, p_seconds: args.seconds,
  });
  if (error) throw new RpcError(extractCode(error.message), error.message);
}
