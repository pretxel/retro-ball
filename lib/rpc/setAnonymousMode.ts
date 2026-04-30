'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';

export async function setAnonymousMode(args: { participantId: string; on: boolean }): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase.rpc('set_anonymous_mode', {
    p_participant_id: args.participantId, p_on: args.on,
  });
  if (error) throw new RpcError(extractCode(error.message), error.message);
}
