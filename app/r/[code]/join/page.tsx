import { JoinRoomForm } from '@/app/_components/JoinRoomForm';

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="riso-panel w-full max-w-md px-8 py-10 md:px-10 md:py-12 relative">
        <span className="riso-stamp">HELLO</span>
        <p className="riso-caps text-[0.7rem] text-[var(--accent)] mb-3">You&rsquo;re invited</p>
        <h1 className="riso-display text-4xl md:text-5xl leading-[0.92] mb-2">
          Join room
        </h1>
        <p className="riso-mono text-3xl md:text-4xl text-[var(--accent)] font-bold tracking-[0.2em] mb-6">
          {code}
        </p>
        <JoinRoomForm code={code} />
      </div>
    </main>
  );
}
