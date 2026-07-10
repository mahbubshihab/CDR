/**
 * Guesses the Bangladeshi mobile operator of a phone number based on its prefix
 */
export function getBPartyOperator(phoneNumber: string): string {
  if (!phoneNumber) return 'Unknown';
  
  // Strip any non-digit characters
  const clean = phoneNumber.replace(/[^0-9]/g, '');
  
  // Normalize Bangladeshi number to starting prefix
  let normalized = clean;
  if (clean.startsWith('880')) {
    normalized = clean.substring(3); // e.g. 1716857863
  }
  
  // If it starts with 0, strip it to match prefix easily (e.g. 01716 -> 1716)
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1);
  }

  // Check prefix
  if (normalized.startsWith('17') || normalized.startsWith('13')) return 'Grameenphone';
  if (normalized.startsWith('18')) return 'Robi';
  if (normalized.startsWith('19') || normalized.startsWith('14')) return 'Banglalink';
  if (normalized.startsWith('15')) return 'Teletalk';
  if (normalized.startsWith('16')) return 'Airtel';

  return 'Unknown';
}
