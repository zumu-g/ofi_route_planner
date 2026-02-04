const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export interface AutocompleteResult {
  placeId: string;
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
  type: string;
  state?: string;
  suburb?: string;
  postcode?: string;
}

// Rate limiting: track last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second as per Nominatim usage policy

async function rateLimitedFetch(url: string, options: RequestInit): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  return fetch(url, options);
}

function formatShortAddress(result: NominatimResult): string {
  const parts: string[] = [];
  const address = result.address;
  
  // Build a clean short address
  if (address) {
    // Street address
    const houseNumber = address.house_number;
    const road = address.road;
    
    if (houseNumber && road) {
      parts.push(`${houseNumber} ${road}`);
    } else if (road) {
      parts.push(road);
    }
    
    // Suburb/locality
    const suburb = address.suburb || address.neighbourhood || address.village || address.town || address.city_district;
    if (suburb) {
      parts.push(suburb);
    }
    
    // State abbreviation
    const state = address.state;
    if (state) {
      // Convert full state names to abbreviations for Australian states
      const stateAbbreviations: Record<string, string> = {
        'Victoria': 'VIC',
        'New South Wales': 'NSW',
        'Queensland': 'QLD',
        'South Australia': 'SA',
        'Western Australia': 'WA',
        'Tasmania': 'TAS',
        'Northern Territory': 'NT',
        'Australian Capital Territory': 'ACT',
      };
      parts.push(stateAbbreviations[state] || state);
    }
    
    // Postcode
    if (address.postcode) {
      parts.push(address.postcode);
    }
  }
  
  return parts.length > 0 ? parts.join(', ') : result.display_name;
}

interface NominatimAddress {
  house_number?: string;
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  village?: string;
  town?: string;
  city?: string;
  city_district?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: NominatimAddress;
}

export async function searchAddresses(
  query: string,
  filterToVictoria = false
): Promise<AutocompleteResult[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }
  
  try {
    // Add "Victoria, Australia" hint if not already present for better results
    let searchQuery = query.trim();
    if (filterToVictoria && !searchQuery.toLowerCase().includes('vic') && !searchQuery.toLowerCase().includes('victoria')) {
      searchQuery = `${searchQuery}, Victoria`;
    }
    
    const params = new URLSearchParams({
      q: searchQuery,
      countrycodes: 'au',
      format: 'json',
      addressdetails: '1',
      limit: '6',
    });
    
    const response = await rateLimitedFetch(
      `${NOMINATIM_URL}/search?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'OFI Route Planner (https://github.com/zumu-g/ofi_route_planner)',
        },
      }
    );
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn('Autocomplete: Rate limit exceeded, please slow down');
      }
      return [];
    }
    
    const data: NominatimResult[] = await response.json();
    
    // Filter and transform results
    let results: AutocompleteResult[] = data.map((result) => ({
      placeId: result.place_id.toString(),
      displayName: result.display_name,
      shortName: formatShortAddress(result),
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      type: result.type,
      state: result.address?.state,
      suburb: result.address?.suburb || result.address?.neighbourhood || result.address?.village || result.address?.town,
      postcode: result.address?.postcode,
    }));
    
    // Optionally filter to Victoria only
    if (filterToVictoria) {
      results = results.filter(r => 
        r.state === 'Victoria' || 
        r.displayName.toLowerCase().includes('victoria') ||
        r.displayName.toLowerCase().includes(', vic ')
      );
    }
    
    // Limit to 5 results
    return results.slice(0, 5);
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
}

// Debounce helper for use in components
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
