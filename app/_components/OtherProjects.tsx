import Image, { type StaticImageData } from 'next/image';
import potatoDailyShot from '@/public/projects/potato-daily.jpg';
import pokemonPokerShot from '@/public/projects/pokemon-poker.jpg';

type Project = {
  name: string;
  url: string;
  tagline: string;
  /** Screenshot captured from the live site, stored in public/projects. */
  shot: StaticImageData;
};

export const OTHER_PROJECTS: readonly Project[] = [
  {
    name: 'Potato Daily',
    url: 'https://potato-daily.pretxel.deno.net/',
    tagline: 'Random picker for Scrum daily standups.',
    shot: potatoDailyShot,
  },
  {
    name: 'Pokemon Poker',
    url: 'https://pokemon-poker.pretlabs.app/',
    tagline: 'Pokémon-themed Scrum planning poker.',
    shot: pokemonPokerShot,
  },
];

export function OtherProjects() {
  return (
    <section aria-labelledby="other-projects-title" className="mt-16 md:mt-24">
      <h2
        id="other-projects-title"
        className="riso-caps text-[0.75rem] mb-6 text-[color-mix(in_oklab,var(--ink)_70%,transparent)]"
      >
        Other projects
      </h2>
      <ul className="grid gap-8 sm:grid-cols-2">
        {OTHER_PROJECTS.map((p) => {
          const host = new URL(p.url).host;
          return (
            <li key={p.url}>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="riso-panel group flex flex-col overflow-hidden transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_var(--accent)] focus-visible:-translate-y-1 focus-visible:shadow-[10px_10px_0_0_var(--accent)] focus-visible:outline-none"
              >
                <div
                  aria-hidden="true"
                  className="relative aspect-[16/10] overflow-hidden border-b-2 border-[var(--ink)] bg-[var(--paper-dark)]"
                >
                  <Image
                    src={p.shot}
                    alt=""
                    placeholder="blur"
                    sizes="(min-width: 640px) 480px, 100vw"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex flex-col gap-1 px-5 py-4">
                  <span className="riso-display text-2xl">{p.name}</span>
                  <span className="text-sm italic text-[color-mix(in_oklab,var(--ink)_75%,transparent)]">
                    {p.tagline}
                  </span>
                  <span className="riso-mono text-xs text-[color-mix(in_oklab,var(--ink)_55%,transparent)]">
                    {host} ↗
                  </span>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
