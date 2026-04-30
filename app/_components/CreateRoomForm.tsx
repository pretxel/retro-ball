'use client';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createRoomAction, type ActionResult } from '@/lib/rpc/createRoom';
import { toToast } from '@/lib/errors';

export function CreateRoomForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(createRoomAction, null);
  return (
    <form action={formAction} className="grid gap-3">
      <div className="grid gap-1">
        <Label htmlFor="displayName">Your name</Label>
        <Input id="displayName" name="displayName" required maxLength={40} />
      </div>
      <Button type="submit">Create room</Button>
      {state && !state.ok && <p role="alert" className="text-sm text-red-600">{toToast(state.code)}</p>}
    </form>
  );
}
