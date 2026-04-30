export class RpcError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

// PostgrestError shape from @supabase/supabase-js:
// { message: string, details: string, hint: string, code: string }
// Our `raise exception 'foo'` lands in `message` for SQLSTATE P0001.
// Other failures (check constraints, unique violations) populate `code` (SQLSTATE)
// and put the constraint name / detail in `details`.
type SupabaseErrorLike = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

const SQLSTATE_TO_CODE: Record<string, string> = {
  '23514': 'check_constraint',  // CHECK violation (empty body, bad column, length)
  '23505': 'unique_violation',
  '23503': 'foreign_key_violation',
};

export function extractCode(error: SupabaseErrorLike | string | undefined): string {
  if (!error) return 'unknown';
  if (typeof error === 'string') {
    const m = error.match(/^[a-z][a-z_]+$/);
    if (m) return m[0];
    const m2 = error.match(/[a-z][a-z_]{3,}/);
    return m2 ? m2[0] : 'unknown';
  }
  // structured PostgrestError
  if (error.code && SQLSTATE_TO_CODE[error.code]) return SQLSTATE_TO_CODE[error.code];
  if (error.message) {
    // P0001 raises put the snake_case identifier in `message`
    const m = error.message.match(/^[a-z][a-z_]+$/);
    if (m) return m[0];
    const m2 = error.message.match(/[a-z][a-z_]{3,}/);
    if (m2) return m2[0];
  }
  return 'unknown';
}
