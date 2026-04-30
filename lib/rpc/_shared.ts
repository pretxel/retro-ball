export class RpcError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export function extractCode(message: string | undefined): string {
  if (!message) return 'unknown';
  // RPCs raise plain code strings (e.g. 'rate_limited'). PostgREST may wrap
  // them in a longer error message; try to find a known-shape code token.
  const m = message.match(/[a-z][a-z_]+/);
  return m ? m[0] : message;
}
