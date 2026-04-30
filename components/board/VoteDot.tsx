export function VoteDot({ filled }: { filled: boolean }) {
  return (
    <span
      aria-hidden
      className="inline-block w-2.5 h-2.5 rounded-full mr-1 border border-[var(--ink)]"
      style={{
        background: filled ? 'var(--accent)' : 'var(--paper-dark)',
      }}
    />
  );
}
