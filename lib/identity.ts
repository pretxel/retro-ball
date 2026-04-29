export const COOKIE_NAME = 'retroball_pid';

export function serializeIdentity(participantId: string, path = '/'): string {
  const parts = [
    `${COOKIE_NAME}=${participantId}`,
    `Path=${path}`,
    `Max-Age=${60 * 60 * 48}`, // 48h: room TTL is 24h, leeway covers reconnect
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
  ];
  return parts.join('; ');
}

export function parseIdentityFromCookies(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const raw of cookieHeader.split(';')) {
    const [k, v] = raw.trim().split('=');
    if (k === COOKIE_NAME && v) return v;
  }
  return null;
}
