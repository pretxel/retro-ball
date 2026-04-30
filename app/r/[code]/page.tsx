import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { COOKIE_NAME } from '@/lib/identity';
import { Board } from '@/components/board/Board';

export default async function BoardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = await cookies();
  const participantId = c.get(COOKIE_NAME)?.value ?? null;
  if (!participantId) redirect(`/r/${code}/join`);

  const supabase = await getServerClient();
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('id, code, ended_at')
    .eq('code', code)
    .limit(1);
  if (error || !rooms?.length) redirect('/');
  const room = rooms[0];

  // Verify cookie matches a participant in this room
  const { data: parts } = await supabase
    .from('participants')
    .select('id')
    .eq('id', participantId)
    .eq('room_id', room.id);
  if (!parts?.length) redirect(`/r/${code}/join`);

  return <Board roomId={room.id} viewerId={participantId} />;
}
