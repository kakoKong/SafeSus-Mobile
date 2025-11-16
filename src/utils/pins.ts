export type PinType = 'scam' | 'harassment' | 'overcharge' | 'other' | string;

export const getPinColor = (type: PinType): string => {
  switch (type) {
    case 'scam':
      return '#e74c3c';
    case 'harassment':
      return '#f39c12';
    case 'overcharge':
      return '#9b59b6';
    case 'other':
      return '#3498db';
    default:
      return '#95a5a6';
  }
};

export const getPinIcon = (type: PinType): string => {
  switch (type) {
    case 'scam':
      return 'warning';
    case 'harassment':
      return 'person-remove';
    case 'overcharge':
      return 'cash';
    case 'other':
      return 'information-circle';
    default:
      return 'location';
  }
};


