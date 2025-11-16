import type { City } from '../types';
import { BANGKOK_DISTRICTS } from '../constants/geo';

export const isBangkokDistrict = (location: string): boolean => {
  const normalized = (location || '').trim().toLowerCase();
  if (normalized.includes('bangkok') || normalized.includes('krung thep')) {
    return true;
  }
  return BANGKOK_DISTRICTS.some(district =>
    normalized.includes(district) || district.includes(normalized.split(' ')[0])
  );
};

export const findMatchingCity = (geoCity: string, cities: City[]): City | null => {
  const normalize = (s: string) => (s || '').trim().toLowerCase();
  const geoNorm = normalize(geoCity);

  if (isBangkokDistrict(geoCity)) {
    const bangkok = cities.find((c) =>
      normalize(c.name) === 'bangkok' ||
      normalize(c.slug) === 'bangkok' ||
      c.name.toLowerCase().includes('bangkok')
    );
    if (bangkok) return bangkok;
  }

  let matched = cities.find((c) => normalize(c.name) === geoNorm);
  if (matched) return matched;

  matched = cities.find((c) => geoNorm.includes(normalize(c.slug)));
  if (matched) return matched;

  matched = cities.find((c) => {
    const cityNorm = normalize(c.name);
    return cityNorm.startsWith(geoNorm.slice(0, 4)) || geoNorm.startsWith(cityNorm.slice(0, 4));
  });

  return matched || null;
};


