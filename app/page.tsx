import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { CreateRoomForm } from './_components/CreateRoomForm';

async function joinFromLanding(formData: FormData): Promise<void> {
  'use server';
  const code = String(formData.get('code') ?? '').trim();
  if (!/^[0-9]{6}$/.test(code)) throw new Error('invalid_code');
  redirect(`/r/${code}/join`);
}

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
      <div className="grid gap-6 md:grid-cols-2 max-w-3xl w-full">
        <Card>
          <CardHeader><CardTitle>Start a retro</CardTitle></CardHeader>
          <CardContent>
            <CreateRoomForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Join with code</CardTitle></CardHeader>
          <CardContent>
            <form action={joinFromLanding} className="grid gap-3">
              <div className="grid gap-1">
                <Label htmlFor="code">6-digit code</Label>
                <Input id="code" name="code" required pattern="\d{6}" inputMode="numeric" />
              </div>
              <Button type="submit" variant="secondary">Continue</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
