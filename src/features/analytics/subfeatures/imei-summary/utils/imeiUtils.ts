export interface ImeiValidationResult {
  original: string;
  status: 'VALID' | 'CORRECTED' | 'INVALID';
  corrected: string;
  tac: string;
}

/**
 * Calculates the Luhn checksum for a given string of digits.
 * If the string is 14 digits, it returns the 15th digit.
 * If the string is 15 digits, it checks if it's valid.
 */
export function calculateLuhn(imei: string): number {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(imei[i], 10);
    if (i % 2 !== 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }
  return (sum * 9) % 10;
}

export function validateAndCorrectImei(imei: string): ImeiValidationResult {
  // Remove any non-digit characters
  const cleanImei = (imei || '').replace(/\D/g, '');
  
  if (cleanImei.length < 14) {
    return {
      original: imei,
      status: 'INVALID',
      corrected: cleanImei,
      tac: cleanImei.substring(0, 8) || 'N/A'
    };
  }

  // Use the first 14 digits for calculation
  const base14 = cleanImei.substring(0, 14);
  const checkDigit = calculateLuhn(base14);
  const correctedImei = base14 + checkDigit.toString();
  const tac = base14.substring(0, 8);

  let status: 'VALID' | 'CORRECTED' | 'INVALID' = 'INVALID';
  
  if (cleanImei.length >= 15 && cleanImei.substring(0, 15) === correctedImei) {
    status = 'VALID';
  } else if (cleanImei.length >= 14) {
    // If it was exactly 14 digits, or the 15th digit was wrong, we corrected it.
    status = 'CORRECTED';
  }

  return {
    original: cleanImei.substring(0, 15),
    status,
    corrected: correctedImei,
    tac
  };
}
