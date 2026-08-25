export function parsePeruDate(dateStr: string | Date | null | undefined): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  let str = String(dateStr);
  
  // If it's just a date without time (e.g., "2026-08-26"), append time
  if (str.length === 10) {
    str += 'T00:00:00';
  }
  
  // If it doesn't already have timezone info (Z or +/-00:00), force Peru time
  if (!str.includes('Z') && !str.match(/[+-]\d{2}:\d{2}$/)) {
    str += '-05:00';
  }
  
  const date = new Date(str);

  
return isNaN(date.getTime()) ? null : date;
}
