import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { OtherProjects, OTHER_PROJECTS } from '@/app/_components/OtherProjects';

// Vite imports images as URL strings, not Next's StaticImageData, so
// next/image would demand explicit width/height. Render a plain <img>.
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

describe('OtherProjects', () => {
  it('links every project in a new tab without leaking the opener', () => {
    render(<OtherProjects />);
    const section = screen.getByRole('region', { name: 'Other projects' });
    const links = within(section).getAllByRole('link');
    expect(links).toHaveLength(OTHER_PROJECTS.length);
    for (const [i, link] of links.entries()) {
      expect(link).toHaveAttribute('href', OTHER_PROJECTS[i].url);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveTextContent(OTHER_PROJECTS[i].name);
    }
  });

  it('lists Potato Daily and Pokemon Poker', () => {
    expect(OTHER_PROJECTS.map((p) => p.name)).toEqual(['Potato Daily', 'Pokemon Poker']);
  });
});
