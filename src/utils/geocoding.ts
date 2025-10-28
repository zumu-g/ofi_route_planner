const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

// Retry function with exponential backoff
async function retryFetch(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  delay = 1000
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    // If rate limited (429) and not last attempt, wait and retry
    if (response.status === 429 && attempt < maxRetries - 1) {
      const waitTime = delay * Math.pow(2, attempt);
      console.warn(`Rate limited. Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    
    return response;
  }
  
  // Final attempt
  return fetch(url, options);
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const response = await retryFetch(
      `${NOMINATIM_URL}/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'OFI Route Planner (https://github.com/zumu-g/ofi_route_planner)',
        },
      }
    );

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 403) {
        console.error('Geocoding: Access forbidden. API may require authentication or have restrictions.');
      } else if (response.status === 429) {
        console.error('Geocoding: Rate limit exceeded. Please wait a moment before trying again.');
      } else {
        const errorText = await response.text();
        console.error(`Geocoding failed with status ${response.status}:`, errorText);
      }
      return null;
    }

    const data = await response.json();

    // Handle error responses from Nominatim
    if (data.error) {
      console.error('Nominatim API error:', data.error);
      return null;
    }

    if (data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
      };
    }

    return null;
  } catch (error) {
    // Handle network errors, CORS errors, etc.
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Geocoding: Network error. Please check your internet connection.');
    } else {
      console.error('Geocoding error:', error);
    }
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await retryFetch(
      `${NOMINATIM_URL}/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'OFI Route Planner (https://github.com/zumu-g/ofi_route_planner)',
        },
      }
    );

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 403) {
        console.error('Reverse geocoding: Access forbidden. API may require authentication or have restrictions.');
      } else if (response.status === 429) {
        console.error('Reverse geocoding: Rate limit exceeded. Please wait a moment before trying again.');
      } else {
        const errorText = await response.text();
        console.error(`Reverse geocoding failed with status ${response.status}:`, errorText);
      }
      return null;
    }

    const data = await response.json();
    
    // Handle error responses from Nominatim
    if (data.error) {
      console.error('Nominatim API error:', data.error);
      return null;
    }
    
    return data.display_name || null;
  } catch (error) {
    // Handle network errors, CORS errors, etc.
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Reverse geocoding: Network error. Please check your internet connection.');
    } else {
      console.error('Reverse geocoding error:', error);
    }
    return null;
  }
}