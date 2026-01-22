/**
 * Format percentage with one decimal place, but remove .0 decimals
 * Always includes the % symbol
 * Examples: 
 * - 2.0 -> "2%"
 * - 2.3 -> "2,3%"
 * - 100.0 -> "100%"
 * - 33.333 -> "33,3%"
 */
export const formatPercentage = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  
  // If the decimal is .0, return without decimals
  if (rounded % 1 === 0) {
    return `${Math.floor(rounded)}%`;
  }
  
  // Otherwise return with one decimal, using comma for Brazilian locale
  return `${rounded.toFixed(1).replace('.', ',')}%`;
};

/**
 * Calculate percentage from X/N with proper formatting
 */
export const calculateFormattedPercentage = (completed: number, total: number): string => {
  if (total === 0) return '0';
  const percentage = (completed / total) * 100;
  return formatPercentage(percentage);
};

/**
 * Calculate raw percentage from X/N (for use in progress bars etc)
 */
export const calculateRawPercentage = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return (completed / total) * 100;
};
