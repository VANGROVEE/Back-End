export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
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

export const getRadiusFromArea = (areaInHectares: number): number => {
  const areaInM2 = areaInHectares * 10000;
  return Math.sqrt(areaInM2 / Math.PI);
};

export const isLandOverlapping = (
  dist: number,
  r1: number,
  r2: number,
  tolerance: number = 0.95,
): boolean => {
  const safeDistance = (r1 + r2) * tolerance;
  return dist < safeDistance;
};
