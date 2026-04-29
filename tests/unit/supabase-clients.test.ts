import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://x');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'k');

describe('browser client', () => {
  it('imports', async () => {
    const mod = await import('@/lib/supabase/browser');
    expect(typeof mod.getBrowserClient).toBe('function');
  });
});
