import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { joinRoomAction } from '@/lib/rpc/joinRoom';

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  async function action(formData: FormData) {
    'use server';
    await joinRoomAction(code, formData);
  }
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Join room {code}</CardTitle></CardHeader>
        <CardContent>
          <form action={action} className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor="displayName">Your name</Label>
              <Input id="displayName" name="displayName" required maxLength={40} autoFocus />
            </div>
            <Button type="submit">Join</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
