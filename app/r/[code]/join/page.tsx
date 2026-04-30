import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JoinRoomForm } from '@/app/_components/JoinRoomForm';

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Join room {code}</CardTitle></CardHeader>
        <CardContent>
          <JoinRoomForm code={code} />
        </CardContent>
      </Card>
    </main>
  );
}
