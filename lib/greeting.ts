export type GreetingKey =
  | 'greeting_morning'
  | 'greeting_afternoon'
  | 'greeting_evening';

/**
 * Returns the greeting string-key matching the local hour of `date`:
 *   - 'greeting_morning'   for hour ∈ [4, 11]
 *   - 'greeting_afternoon' for hour ∈ [12, 17]
 *   - 'greeting_evening'   otherwise (i.e., hour ∈ [18, 23] ∪ [0, 3])
 *
 * Pure function: depends only on `date.getHours()`.
 */
export function pickGreetingKey(date: Date = new Date()): GreetingKey {
  const hour = date.getHours();
  if (hour >= 4 && hour <= 11) return 'greeting_morning';
  if (hour >= 12 && hour <= 17) return 'greeting_afternoon';
  return 'greeting_evening';
}
