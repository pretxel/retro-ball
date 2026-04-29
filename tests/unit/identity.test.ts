import { describe, it, expect } from 'vitest';
import { COOKIE_NAME, parseIdentityFromCookies, serializeIdentity } from '@/lib/identity';

describe('identity cookie', () => {
  it('serializes and parses a participant id', () => {
    const id = '11111111-1111-1111-1111-111111111111';
    const headerValue = serializeIdentity(id, '/r/123456');
    const parsed = parseIdentityFromCookies(`${COOKIE_NAME}=${id}`);
    expect(parsed).toBe(id);
    expect(headerValue).toContain(`${COOKIE_NAME}=${id}`);
    expect(headerValue).toContain('Path=/r/123456');
    expect(headerValue).toContain('HttpOnly');
    expect(headerValue).toContain('SameSite=Lax');
  });

  it('returns null when cookie missing', () => {
    expect(parseIdentityFromCookies('other=1')).toBeNull();
  });
});
