import { describe, it, expect } from 'vitest';
import { toToast } from '@/lib/errors';

describe('error mapping', () => {
  it('known codes', () => {
    expect(toToast('vote_limit_reached')).toMatch(/vote/i);
    expect(toToast('not_facilitator')).toMatch(/facilitator/i);
    expect(toToast('room_not_found')).toMatch(/room/i);
  });
  it('unknown -> generic', () => {
    expect(toToast('???')).toMatch(/something went wrong/i);
  });
});
