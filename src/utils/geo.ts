// Geo helpers shared across screens
export const extractCoordinates = (item: any): { lat: number; lng: number } | null => {
  if (item?.latitude && item?.longitude) {
    return { lat: item.latitude, lng: item.longitude };
  }
  if (item?.lat && item?.lng) {
    return { lat: item.lat, lng: item.lng };
  }
  if (item?.geom) {
    try {
      if (item.geom.coordinates && Array.isArray(item.geom.coordinates)) {
        const [lng, lat] = item.geom.coordinates;
        return { lat, lng };
      }
      if (item.geom.x !== undefined && item.geom.y !== undefined) {
        return { lat: item.geom.y, lng: item.geom.x };
      }
    } catch {
      // no-op
    }
  }
  if (item?.location?.coordinates && Array.isArray(item.location.coordinates)) {
    const [lng, lat] = item.location.coordinates;
    return { lat, lng };
  }
  return null;
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};


