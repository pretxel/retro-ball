const MAP: Record<string, string> = {
  vote_limit_reached: 'You used all your votes.',
  not_facilitator: 'Only the facilitator can do that.',
  not_authorized: "You can't do that.",
  not_card_owner: 'Only the author can edit this card.',
  not_in_room: 'You left this room — refresh to rejoin.',
  card_not_found: 'Card already removed.',
  room_not_found: 'Room not found or expired.',
  room_ended: 'The retro has ended.',
  rate_limited: 'Slow down a bit.',
  invalid_seconds: 'Pick a duration between 30s and 1h.',
  invalid_votes_per_user: 'Votes per user must be 1–20.',
  room_code_exhausted: 'Could not generate a unique code, try again.',
  display_name_required: 'Please enter your name.',
  check_constraint: 'That value is not allowed.',
  unique_violation: 'That already exists.',
  foreign_key_violation: 'That reference no longer exists.',
};

export function toToast(code: string | null | undefined): string {
  return (code && MAP[code]) || 'Something went wrong.';
}
