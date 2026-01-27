/**
 * Format a Date object as YYYY-MM-DD string using local timezone
 * This avoids the one-day shift caused by toISOString() which uses UTC
 */
export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse a YYYY-MM-DD string as a local Date object
 * This avoids UTC interpretation that can cause date shifts
 */
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Get today's date as a YYYY-MM-DD string in local timezone
 */
export const getTodayStr = (): string => {
  return formatLocalDate(new Date());
};
