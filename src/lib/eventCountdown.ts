/** Whole calendar days until an event date (date-only / ISO). Decreases each local midnight. */
export function daysUntilEvent(dateIso: string | Date | null | undefined, fallback = 0): number {
  if (dateIso == null || dateIso === "") return Math.max(0, fallback);
  const d = dateIso instanceof Date ? dateIso : new Date(dateIso);
  if (Number.isNaN(d.getTime())) return Math.max(0, fallback);

  // Events are stored as date-only (UTC midnight from <input type="date">).
  // Compare calendar days in the user's local timezone.
  const eventDay = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const today = new Date();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = eventDay.getTime() - todayDay.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

/** True when the event calendar day is before today (today still counts as upcoming). */
export function isEventPast(dateIso: string | Date | null | undefined): boolean {
  if (dateIso == null || dateIso === "") return false;
  const d = dateIso instanceof Date ? dateIso : new Date(dateIso);
  if (Number.isNaN(d.getTime())) return false;
  const eventDay = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const today = new Date();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return eventDay.getTime() < todayDay.getTime();
}
