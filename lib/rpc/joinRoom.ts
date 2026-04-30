'use server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getServerClient } from '@/lib/supabase/server';
import { COOKIE_NAME } from '@/lib/identity';

export async function joinRoomAction(code: string, formData: FormData): Promise<void> {
  const displayName = String(formData.get('displayName') ?? '').trim();
  if (!displayName) throw new Error('display_name_required');
  const supabase = await getServerClient();
  const { data, error } = await supabase.rpc('join_room', { p_code: code, p_display_name: displayName });
  if (error || !data?.[0]) throw new Error(error?.message ?? 'join_failed');
  const { participant_id } = data[0];
  const c = await cookies();
  c.set(COOKIE_NAME, participant_id, {
    path: `/r/${code}`,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 48,
  });
  redirect(`/r/${code}`);
}
