import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { redirect } from 'next/navigation';
import { CreateRoomForm } from './_components/CreateRoomForm';
import { OtherProjects } from './_components/OtherProjects';

async function joinFromLanding(formData: FormData): Promise<void> {
  'use server';
  const code = String(formData.get('code') ?? '').trim();
  if (!/^[0-9]{6}$/.test(code)) throw new Error('invalid_code');
  redirect(`/r/${code}/join`);
}

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col px-6 py-10 md:py-16">
      <div className="mx-auto w-full max-w-5xl flex-1 flex flex-col">
        <header className="mb-12 md:mb-16">
          <h1 className="riso-display text-[18vw] md:text-[10rem] leading-[0.85] tracking-[-0.04em]">
            <span className="block">Retro</span>
            <span className="block italic text-[var(--accent)]" style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}>
              Ball<span className="text-[var(--ink)]">.</span>
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg italic text-[color-mix(in_oklab,var(--ink)_75%,transparent)]" style={{ fontFamily: 'var(--font-body)' }}>
            Run an honest retro with your team. No accounts, no clutter, ephemeral.
          </p>
        </header>

        <section className="grid gap-10 md:grid-cols-2 md:gap-12">
          <div className="riso-panel relative px-7 py-8 md:px-9 md:py-10">
            <span className="riso-stamp">START</span>
            <h2 className="riso-display text-4xl md:text-5xl mb-1">Start a retro</h2>
            <p className="text-sm italic mb-6 text-[color-mix(in_oklab,var(--ink)_70%,transparent)]">
              Spin up a fresh room. You become the facilitator.
            </p>
            <CreateRoomForm />
          </div>

          <div className="riso-panel relative px-7 py-8 md:px-9 md:py-10" style={{ boxShadow: '8px 8px 0 0 var(--accent)' }}>
            <span className="riso-stamp riso-stamp--ink">JOIN</span>
            <h2 className="riso-display text-4xl md:text-5xl mb-1">Join with code</h2>
            <p className="text-sm italic mb-6 text-[color-mix(in_oklab,var(--ink)_70%,transparent)]">
              Got a six-digit code from your team? Enter it here.
            </p>
            <form action={joinFromLanding} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">6-digit code</Label>
                <Input
                  id="code"
                  name="code"
                  required
                  pattern="\d{6}"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="------"
                  className="riso-mono text-2xl tracking-[0.4em] text-center"
                />
              </div>
              <Button type="submit">Continue</Button>
            </form>
          </div>
        </section>

        <OtherProjects />

        <footer className="mt-auto pt-16 md:pt-24 text-center">
          <p className="riso-caps text-[0.65rem] text-[color-mix(in_oklab,var(--ink)_55%,transparent)]">
            All rooms expire after 24 hours of silence.
          </p>
          <p className="riso-caps mt-2 text-[0.65rem] text-[color-mix(in_oklab,var(--ink)_55%,transparent)]">
            Made with ❤️ | 2026 | pretxel
          </p>
        </footer>
      </div>
    </main>
  );
}
