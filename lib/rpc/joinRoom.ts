'use server';
import { cookies } from 'next/headers';
import { getServerClient } from '@/lib/supabase/server';
import { COOKIE_NAME } from '@/lib/identity';
import type { ActionResult } from './createRoom';

export async function joinRoomAction(code: string, _prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const displayName = String(formData.get('displayName') ?? '').trim();
  if (!displayName) return { ok: false, code: 'display_name_required' };
  const supabase = await getServerClient();
  const { data, error } = await supabase.rpc('rb_join_room', { p_code: code, p_display_name: displayName });
  if (error || !data?.[0]) return { ok: false, code: error?.message ?? 'join_failed' };
  const { participant_id } = data[0];
  const c = await cookies();
  c.set(COOKIE_NAME, participant_id, {
    path: `/r/${code}`,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 48,
  });
  return { ok: true, redirectTo: `/r/${code}` };
}
