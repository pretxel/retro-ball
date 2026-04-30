export function VoteDot({ filled }: { filled: boolean }) {
  return <span aria-hidden className={`inline-block w-2 h-2 rounded-full mr-1 ${filled ? 'bg-blue-600' : 'bg-zinc-300'}`} />;
}
