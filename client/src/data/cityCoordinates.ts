export const CITY_COORDINATES: Record<string, [number, number]> = {
  'Manchester, UK': [53.4808, -2.2426],
  'Bristol, UK': [51.4545, -2.5879],
  'Leeds, UK': [53.8008, -1.5491],
  'Glasgow, UK': [55.8642, -4.2518],
  'Coventry, UK': [52.4068, -1.5197],
  'Liverpool, UK': [53.4084, -2.9916],
  'Southampton, UK': [50.9097, -1.4044],
  'Cardiff, UK': [51.4816, -3.1791],
  'Edinburgh, UK': [55.9533, -3.1883],
  'Newcastle, UK': [54.9783, -1.6178],
  'Dover, UK': [51.1279, 1.3134],
  'Holyhead, UK': [53.3094, -4.6339],
  'Berlin, Germany': [52.52, 13.405],
  'Dublin, Ireland': [53.3498, -6.2603],
  'Madrid, Spain': [40.4168, -3.7038],
  'Paris, France': [48.8566, 2.3522],
  'Amsterdam, Netherlands': [52.3676, 4.9041],
  'Rome, Italy': [41.9028, 12.4964],
  'Lisbon, Portugal': [38.7223, -9.1393],
  'Brussels, Belgium': [50.8503, 4.3517],
  'Copenhagen, Denmark': [55.6761, 12.5683],
  'Vienna, Austria': [48.2082, 16.3738],
  'Prague, Czech Republic': [50.0755, 14.4378],
  'Rotterdam, Netherlands': [51.9244, 4.4777],
  'Lyon, France': [45.764, 4.8357],
  'Bordeaux, France': [44.8378, -0.5792],
  'Hamburg, Germany': [53.5511, 9.9937],
};

export function getCoordinates(location: string): [number, number] | null {
  return CITY_COORDINATES[location.trim()] ?? null;
}
