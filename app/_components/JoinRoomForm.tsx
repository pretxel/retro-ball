'use client';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { joinRoomAction } from '@/lib/rpc/joinRoom';
import type { ActionResult } from '@/lib/rpc/createRoom';
import { toToast } from '@/lib/errors';

export function JoinRoomForm({ code }: { code: string }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    async (previousState, formData) => {
      const result = await joinRoomAction(code, previousState, formData);
      if (result.ok) window.location.assign(result.redirectTo);
      return result;
    },
    null,
  );
  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="displayName">Your name</Label>
        <Input id="displayName" name="displayName" required maxLength={40} autoFocus placeholder="Type to introduce yourself" />
      </div>
      <Button type="submit">Join the retro</Button>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-[var(--accent)] font-medium italic">
          {toToast(state.code)}
        </p>
      )}
    </form>
  );
}
