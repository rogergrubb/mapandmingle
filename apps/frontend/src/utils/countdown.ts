/**
 * Format a countdown from now until a target date
 * Returns human-readable strings like "Starts in 2h" or "Started 30m ago"
 */
export function formatCountdown(targetDate: Date | string): string {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  
  // Event already started
  if (diff < 0) {
    const minutesAgo = Math.floor(Math.abs(diff) / (1000 * 60));
    const hoursAgo = Math.floor(minutesAgo / 60);
    const daysAgo = Math.floor(hoursAgo / 24);
    
    if (daysAgo > 0) return `Started ${daysAgo}d ago`;
    if (hoursAgo > 0) return `Started ${hoursAgo}h ago`;
    if (minutesAgo > 0) return `Started ${minutesAgo}m ago`;
    return 'Just started';
  }
  
  // Event in the future
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    // Show date for far future events
    return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (days > 0) return `Starts in ${days}d`;
  if (hours > 0) return `Starts in ${hours}h`;
  if (minutes > 5) return `Starts in ${minutes}m`;
  if (minutes > 0) return `Starting soon!`;
  return 'Starting now!';
}

/**
 * Get a compact countdown for pin labels
 * Returns very short strings like "2h" or "30m"
 */
export function getCompactCountdown(targetDate: Date | string): string {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  
  if (diff < 0) return 'Live';
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return 'Now!';
}

/**
 * Get countdown color based on urgency
 */
export function getCountdownColor(targetDate: Date | string): string {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  
  if (diff < 0) return '#22c55e'; // Green for live/started
  
  const minutes = Math.floor(diff / (1000 * 60));
  
  if (minutes < 15) return '#ef4444'; // Red for starting very soon
  if (minutes < 60) return '#f97316'; // Orange for starting soon
  if (minutes < 240) return '#eab308'; // Yellow for starting in a few hours
  return '#3b82f6'; // Blue for future events
}
