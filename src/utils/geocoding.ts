const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    // Get country code from settings or use default
    const settings = JSON.parse(localStorage.getItem('ofi-route-planner-settings') || '{}');
    const countryCode = settings.defaultCountryCode || 'au'; // Default to Australia
    
    const response = await fetch(
      `${NOMINATIM_URL}/search?q=${encodeURIComponent(address)}&format=json&limit=5&countrycodes=${countryCode}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'OFI Route Planner',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to geocode address');
    }

    const data = await response.json();

    if (data.length > 0) {
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      // Validate coordinates
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.error('Invalid coordinates received:', { lat: result.lat, lon: result.lon });
        return null;
      }
      
      console.log('Geocoded address:', address, 'to coordinates:', { lat, lng });
      
      return {
        lat,
        lng,
        displayName: result.display_name,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `${NOMINATIM_URL}/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'OFI Route Planner',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to reverse geocode');
    }

    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}