'use client';
import { getBrowserClient } from '@/lib/supabase/browser';
import { RpcError, extractCode } from './_shared';

export async function endRoom(args: { participantId: string }): Promise<void> {
  const supabase = getBrowserClient();
  const { error } = await supabase.rpc('end_room', { p_participant_id: args.participantId });
  if (error) throw new RpcError(extractCode(error.message), error.message);
}
