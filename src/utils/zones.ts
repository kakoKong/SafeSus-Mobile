export type ZoneLevel = 'recommended' | 'neutral' | 'caution' | 'avoid' | string;

export const getZoneColor = (level: ZoneLevel): string => {
  switch (level) {
    case 'recommended':
      return '#27ae60';
    case 'neutral':
      return '#3498db';
    case 'caution':
      return '#f39c12';
    case 'avoid':
      return '#e74c3c';
    default:
      return '#95a5a6';
  }
};


