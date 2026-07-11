export interface ServiceMapping {
  label: string;
  organization: string;
  operator: string;
  idType: string;
  category: string;
  classification: string;
  confidence: number;
}

export const KNOWN_SERVICES: Record<string, ServiceMapping> = {
  // Bangladesh Emergency
  '999': { label: 'National Emergency', organization: 'Bangladesh Police', operator: 'All', idType: 'Short Code', category: 'Emergency', classification: 'Emergency Service', confidence: 100 },
  '100': { label: 'Police Control Room', organization: 'Bangladesh Police', operator: 'All', idType: 'Short Code', category: 'Emergency', classification: 'Police Helpline', confidence: 100 },
  '101': { label: 'RAB Control Room', organization: 'Rapid Action Battalion', operator: 'All', idType: 'Short Code', category: 'Emergency', classification: 'Law Enforcement', confidence: 100 },
  '102': { label: 'Fire Service', organization: 'Fire Service and Civil Defence', operator: 'All', idType: 'Short Code', category: 'Emergency', classification: 'Fire Service', confidence: 100 },
  '103': { label: 'Ambulance', organization: 'National Ambulance', operator: 'All', idType: 'Short Code', category: 'Emergency', classification: 'Medical', confidence: 100 },
  '104': { label: 'ACC Helpline', organization: 'Anti-Corruption Commission', operator: 'All', idType: 'Short Code', category: 'Government', classification: 'Govt Helpline', confidence: 95 },
  '109': { label: 'Women & Children Help', organization: 'Govt of Bangladesh', operator: 'All', idType: 'Short Code', category: 'Government', classification: 'Govt Helpline', confidence: 95 },
  '1090': { label: 'Disaster Warning', organization: 'Govt of Bangladesh', operator: 'All', idType: 'Short Code', category: 'Emergency', classification: 'Disaster Management', confidence: 95 },
  '16216': { label: 'bKash Helpline', organization: 'bKash Limited', operator: 'All', idType: 'Short Code', category: 'Banking', classification: 'MFS Helpline', confidence: 98 },
  '16167': { label: 'Nagad Helpline', organization: 'Nagad', operator: 'All', idType: 'Short Code', category: 'Banking', classification: 'MFS Helpline', confidence: 98 },
  '16222': { label: 'Bangladesh Bank', organization: 'Bangladesh Bank', operator: 'All', idType: 'Short Code', category: 'Banking', classification: 'Central Bank', confidence: 95 },
  '121': { label: 'GP/Robi Helpline', organization: 'Telecom Operator', operator: 'Multiple', idType: 'Short Code', category: 'Telecom', classification: 'Customer Care', confidence: 90 },
  '111': { label: 'Operator Services', organization: 'Telecom Operator', operator: 'Multiple', idType: 'Short Code', category: 'Telecom', classification: 'Customer Care', confidence: 90 },
  '158': { label: 'BTRC Complain', organization: 'BTRC', operator: 'All', idType: 'Short Code', category: 'Government', classification: 'Regulatory', confidence: 95 },
  '333': { label: 'National Info Service', organization: 'Govt of Bangladesh', operator: 'All', idType: 'Short Code', category: 'Government', classification: 'Govt Helpline', confidence: 98 },
  '16247': { label: 'bKash USSD', organization: 'bKash Limited', operator: 'All', idType: 'USSD', category: 'Banking', classification: 'MFS Service', confidence: 98 },
  
  // Text Hex IDs (Alpha Sender IDs)
  'bKash': { label: 'bKash SMS', organization: 'bKash Limited', operator: 'All', idType: 'Hex ID', category: 'Banking', classification: 'MFS Notification', confidence: 99 },
  'Nagad': { label: 'Nagad SMS', organization: 'Nagad', operator: 'All', idType: 'Hex ID', category: 'Banking', classification: 'MFS Notification', confidence: 99 },
  'GP': { label: 'Grameenphone', organization: 'Grameenphone Ltd.', operator: 'GP', idType: 'Hex ID', category: 'Telecom', classification: 'Telecom Notification', confidence: 99 },
  'Robi': { label: 'Robi Axiata', organization: 'Robi Axiata Ltd.', operator: 'Robi', idType: 'Hex ID', category: 'Telecom', classification: 'Telecom Notification', confidence: 99 },
  'Banglalink': { label: 'Banglalink Digital', organization: 'Banglalink', operator: 'Banglalink', idType: 'Hex ID', category: 'Telecom', classification: 'Telecom Notification', confidence: 99 },
  'Teletalk': { label: 'Teletalk BD', organization: 'Teletalk', operator: 'Teletalk', idType: 'Hex ID', category: 'Telecom', classification: 'Telecom Notification', confidence: 99 },
  'POLICE': { label: 'Bangladesh Police', organization: 'Bangladesh Police', operator: 'All', idType: 'Hex ID', category: 'Government', classification: 'Law Enforcement', confidence: 99 },
  'Daraz': { label: 'Daraz BD', organization: 'Daraz', operator: 'All', idType: 'Hex ID', category: 'Corporate', classification: 'E-commerce', confidence: 95 },
  'Foodpanda': { label: 'Foodpanda BD', organization: 'Foodpanda', operator: 'All', idType: 'Hex ID', category: 'Corporate', classification: 'Food Delivery', confidence: 95 },
  'Pathao': { label: 'Pathao', organization: 'Pathao', operator: 'All', idType: 'Hex ID', category: 'Corporate', classification: 'Ride Sharing', confidence: 95 },
  
  // Pakistan ones (from reference image) just in case
  '3737': { label: 'JazzCash Helpline', organization: 'JazzCash', operator: 'Jazz', idType: 'Short Code', category: 'Banking', classification: 'Bank Helpline', confidence: 97 },
};

export function lookupService(number: string): ServiceMapping {
  // Exact match
  if (KNOWN_SERVICES[number]) {
    return KNOWN_SERVICES[number];
  }
  
  // Handle alphabetic sender IDs not in our exact match list
  if (/^[a-zA-Z]+[a-zA-Z0-9\s]*$/.test(number)) {
    return {
      label: number,
      organization: 'Unknown Organization',
      operator: '—',
      idType: 'Hex ID',
      category: 'Unknown Hex',
      classification: 'Alpha Sender',
      confidence: 50
    };
  }

  // Handle landline codes starting with area codes if it matches a pattern
  // E.g., 091... 042... (from reference image, Peshawar/Lahore) or BD landlines (02, 031, etc)
  if (number.startsWith('02') && number.length === 9) {
    return {
      label: `Dhaka Landline (${number})`,
      organization: 'Unknown Organization',
      operator: 'BTCL',
      idType: 'Government Exchange',
      category: 'Government',
      classification: 'Landline Number',
      confidence: 80
    };
  }

  // Generic Short Code
  if (number.length <= 6 && !/^[a-zA-Z]+$/.test(number)) {
    return {
      label: `Service Code (${number})`,
      organization: 'Unknown Organization',
      operator: '—',
      idType: 'Short Code',
      category: 'Unknown',
      classification: 'Unknown Service',
      confidence: 40
    };
  }

  // Default fallback for normal numbers (though usually these won't be passed to this analyzer)
  return {
    label: number,
    organization: 'Unknown',
    operator: '—',
    idType: 'Regular Number',
    category: 'Standard',
    classification: 'Standard Dial',
    confidence: 0
  };
}
