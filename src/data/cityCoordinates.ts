// Static lat/lng lookup for Indian cities used in TripSmart
// Data sourced from approximate city centre coordinates
export const cityCoordinates: Record<string, [number, number]> = {
  // Major metros
  'Mumbai': [19.076, 72.8777],
  'Delhi': [28.6139, 77.2090],
  'New Delhi': [28.6139, 77.2090],
  'Bengaluru': [12.9716, 77.5946],
  'Bangalore': [12.9716, 77.5946],
  'Chennai': [13.0827, 80.2707],
  'Kolkata': [22.5726, 88.3639],
  'Hyderabad': [17.3850, 78.4867],
  'Pune': [18.5204, 73.8567],
  'Ahmedabad': [23.0225, 72.5714],

  // Tourist cities
  'Goa': [15.2993, 74.1240],
  'Jaipur': [26.9124, 75.7873],
  'Agra': [27.1767, 78.0081],
  'Varanasi': [25.3176, 82.9739],
  'Rishikesh': [30.0869, 78.2676],
  'Haridwar': [29.9457, 78.1642],
  'Shimla': [31.1048, 77.1734],
  'Manali': [32.2396, 77.1887],
  'Darjeeling': [27.0360, 88.2627],
  'Ooty': [11.4102, 76.6950],

  // South India
  'Kochi': [9.9312, 76.2673],
  'Thiruvananthapuram': [8.5241, 76.9366],
  'Madurai': [9.9252, 78.1198],
  'Mysuru': [12.2958, 76.6394],
  'Mysore': [12.2958, 76.6394],
  'Coimbatore': [11.0168, 76.9558],
  'Visakhapatnam': [17.6868, 83.2185],
  'Vijayawada': [16.5062, 80.6480],
  'Tiruchirappalli': [10.7905, 78.7047],
  'Trivandrum': [8.5241, 76.9366],

  // North India
  'Amritsar': [31.6340, 74.8723],
  'Chandigarh': [30.7333, 76.7794],
  'Lucknow': [26.8467, 80.9462],
  'Kanpur': [26.4499, 80.3319],
  'Patna': [25.5941, 85.1376],
  'Ranchi': [23.3441, 85.3096],
  'Bhopal': [23.2599, 77.4126],
  'Indore': [22.7196, 75.8577],
  'Nagpur': [21.1458, 79.0882],
  'Surat': [21.1702, 72.8311],
  'Vadodara': [22.3072, 73.1812],
  'Rajkot': [22.3039, 70.8022],

  // East India
  'Bhubaneswar': [20.2961, 85.8245],
  'Guwahati': [26.1445, 91.7362],
  'Shillong': [25.5788, 91.8933],
  'Puri': [19.8135, 85.8312],
  'Siliguri': [26.7271, 88.3953],

  // West India
  'Udaipur': [24.5854, 73.7125],
  'Jodhpur': [26.2389, 73.0243],
  'Jaisalmer': [26.9157, 70.9083],
  'Aurangabad': [19.8762, 75.3433],
  'Nashik': [19.9975, 73.7898],

  // Hill stations
  'Mussoorie': [30.4598, 78.0664],
  'Nainital': [29.3803, 79.4636],
  'Kodaikanal': [10.2381, 77.4892],
  'Munnar': [10.0892, 77.0595],

  // Other popular
  'Dehradun': [30.3165, 78.0322],
  'Srinagar': [34.0837, 74.7973],
  'Leh': [34.1526, 77.5770],
  'Puducherry': [11.9416, 79.8083],
  'Pondicherry': [11.9416, 79.8083],
  'Kolhapur': [16.7050, 74.2433],
  'Aligarh': [27.8974, 78.0880],
  'Allahabad': [25.4358, 81.8463],
  'Prayagraj': [25.4358, 81.8463],
  'Meerut': [28.9845, 77.7064],
  'Noida': [28.5355, 77.3910],
  'Gurugram': [28.4595, 77.0266],
  'Gurgaon': [28.4595, 77.0266],
  'Faridabad': [28.4089, 77.3178],
  'Agartala': [23.8315, 91.2868],
  'Imphal': [24.8170, 93.9368],
  'Aizawl': [23.7307, 92.7173],
  'Kohima': [25.6751, 94.1086],
  'Itanagar': [27.0844, 93.6053],
  'Gangtok': [27.3314, 88.6138],
  'Panaji': [15.4909, 73.8278],

  // Default fallback – centre of India
  'India': [20.5937, 78.9629],
};

export function getCoordinates(cityName: string): [number, number] | null {
  if (!cityName) return null;
  // Try exact match first
  if (cityCoordinates[cityName]) return cityCoordinates[cityName];
  // Try case-insensitive match
  const key = Object.keys(cityCoordinates).find(
    k => k.toLowerCase() === cityName.toLowerCase()
  );
  return key ? cityCoordinates[key] : null;
}

/** IATA airport code → approximate [lat, lng] */
export const iataCoordinates: Record<string, [number, number]> = {
  // Major metros
  'DEL': [28.5561, 77.1000], // Indira Gandhi International
  'BOM': [19.0896, 72.8656], // Chhatrapati Shivaji
  'BLR': [13.1979, 77.7063], // Kempegowda
  'MAA': [12.9941, 80.1709], // Chennai
  'CCU': [22.6549, 88.4467], // Kolkata
  'HYD': [17.2402, 78.4294], // Rajiv Gandhi
  'PNQ': [18.5822, 73.9197], // Pune
  'AMD': [23.0772, 72.6347], // Ahmedabad

  // Tourist/regional
  'GOI': [15.3808, 73.8314], // Goa Dabolim
  'JAI': [26.8243, 75.8122], // Jaipur
  'COK': [10.1520, 76.3919], // Kochi
  'SXR': [33.9871, 74.7742], // Srinagar
  'IXL': [34.1359, 77.5469], // Leh
  'ATQ': [31.7096, 74.7974], // Amritsar
  'UDR': [24.6177, 73.8961], // Udaipur
  'VNS': [25.4524, 82.8593], // Varanasi
  'IXZ': [11.6412, 92.7296], // Port Blair
  'IXB': [26.6812, 88.3286], // Bagdogra
  'BBI': [20.2444, 85.8178], // Bhubaneswar
  'GAU': [26.1061, 91.5859], // Guwahati
  'TRV': [8.4821,  76.9201], // Trivandrum
  'CJB': [11.0300, 77.0434], // Coimbatore
  'VGA': [16.5303, 80.7967], // Vijayawada
  'VTZ': [17.7212, 83.2247], // Visakhapatnam
  'IXC': [30.6735, 76.7885], // Chandigarh
  'LKO': [26.7606, 80.8893], // Lucknow
  'PAT': [25.5913, 85.0879], // Patna
  'BHO': [23.2875, 77.3374], // Bhopal
  'IDR': [22.7218, 75.8011], // Indore
  'NAG': [21.0922, 79.0472], // Nagpur
  'STV': [21.1640, 72.7417], // Surat
  'RAJ': [22.3092, 70.7795], // Rajkot
};

/** Lookup coordinates by IATA code */
export function getCoordinatesByIATA(iata: string): [number, number] | null {
  if (!iata) return null;
  return iataCoordinates[iata.toUpperCase()] ?? null;
}

/** Haversine distance in km between two [lat, lng] points */
export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** Generate a quadratic Bézier arc between two points (for flight visualization) */
export function arcPath(
  from: [number, number],
  to: [number, number],
  curvature = 0.25,
  steps = 60
): [number, number][] {
  const midLat = (from[0] + to[0]) / 2;
  const midLng = (from[1] + to[1]) / 2;
  const dLat = to[0] - from[0];
  const dLng = to[1] - from[1];
  const dist = Math.sqrt(dLat * dLat + dLng * dLng);
  if (dist === 0) return [from, to];
  // Perpendicular control point (offset above the line)
  const ctrl: [number, number] = [
    midLat + (dLng / dist) * dist * curvature,
    midLng - (dLat / dist) * dist * curvature,
  ];
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lt = (1 - t) ** 2 * from[0] + 2 * (1 - t) * t * ctrl[0] + t ** 2 * to[0];
    const lg = (1 - t) ** 2 * from[1] + 2 * (1 - t) * t * ctrl[1] + t ** 2 * to[1];
    pts.push([lt, lg]);
  }
  return pts;
}

