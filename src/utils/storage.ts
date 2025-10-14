import type { Location } from '../types';

const STORAGE_KEY = 'ofi-route-planner-locations';
const SETTINGS_KEY = 'ofi-route-planner-settings';
const LAST_LOCATION_KEY = 'ofi-route-planner-last-location';
const SAVED_ROUTES_KEY = 'ofi-route-planner-saved-routes';

interface StorageData {
  locations: Location[];
  lastSaved: string;
  version: string;
}

interface Settings {
  useGoogleMapsDistances: boolean;
  googleMapsApiKey?: string;
  defaultCountryCode?: string; // ISO country code for geocoding
}

interface LastLocationData {
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
}

interface SavedRoute {
  id: string;
  name: string;
  locations: Location[];
  savedAt: string;
  routeDate?: string;
  startTime?: string;
}

export const storage = {
  saveLocations: (locations: Location[]): void => {
    try {
      const data: StorageData = {
        locations,
        lastSaved: new Date().toISOString(),
        version: '1.0.0'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save locations to localStorage:', error);
    }
  },

  loadLocations: (): Location[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const parsed: StorageData = JSON.parse(data);
      return parsed.locations || [];
    } catch (error) {
      console.error('Failed to load locations from localStorage:', error);
      return [];
    }
  },

  clearLocations: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear locations from localStorage:', error);
    }
  },

  saveSettings: (settings: Settings): void => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  },

  loadSettings: (): Settings => {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return { useGoogleMapsDistances: false };
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
      return { useGoogleMapsDistances: false };
    }
  },

  saveLastLocation: (address: string): void => {
    try {
      console.log('Saving last location from address:', address);
      // Extract suburb/city from address
      const parts = address.split(',').map(p => p.trim());
      const lastLocationData: LastLocationData = {};
      
      if (parts.length >= 2) {
        // Handle Australian format: "123 Street Name, Suburb State Postcode"
        // or "123 Street Name, Suburb, State Postcode"
        const lastPart = parts[parts.length - 1];
        
        // Extract postcode (4 digits in Australia)
        const postcodeMatch = lastPart.match(/(\d{4})$/);
        if (postcodeMatch) {
          lastLocationData.postcode = postcodeMatch[1];
        }
        
        // Extract state (2-3 letter abbreviation before postcode)
        const stateMatch = lastPart.match(/\b(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\b/i);
        if (stateMatch) {
          lastLocationData.state = stateMatch[1].toUpperCase();
        }
        
        // Extract suburb/city
        if (parts.length === 2) {
          // Format: "Street, Suburb State Postcode"
          let suburb = parts[1];
          console.log('Extracting from 2-part address, second part:', suburb);
          // Remove state and postcode to get just suburb
          // Updated regex to be more flexible
          suburb = suburb.replace(/\s*(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\s*\d{4}$/i, '').trim();
          console.log('Suburb after cleanup:', suburb);
          if (suburb) lastLocationData.suburb = suburb;
        } else if (parts.length >= 3) {
          // Format: "Street, Suburb, State Postcode" or more complex
          console.log('Extracting from multi-part address:', parts);
          lastLocationData.suburb = parts[1]; // Second part is usually suburb
          if (parts.length >= 4) {
            lastLocationData.city = parts[2]; // Third part might be city
          }
        }
      } else if (parts.length === 1) {
        // Handle single-part addresses by checking for patterns
        const singlePart = parts[0];
        console.log('Single part address:', singlePart);
        
        // Check if it contains state and postcode at the end
        const statePostcodeMatch = singlePart.match(/\b([A-Za-z\s]+)\s+(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\s*(\d{4})$/i);
        if (statePostcodeMatch) {
          // Extract suburb from addresses like "23 Brune St Bondi NSW 2026"
          const fullMatch = statePostcodeMatch[0];
          const beforeStatePostcode = singlePart.substring(0, singlePart.indexOf(fullMatch)).trim();
          
          // Try to extract suburb name (usually after street name)
          const words = beforeStatePostcode.split(/\s+/);
          if (words.length >= 3) {
            // Assume format like "123 Street Name Suburb"
            // Skip number and street name, take the rest as suburb
            const streetTypeIndex = words.findIndex(w => 
              /^(st|street|rd|road|ave|avenue|dr|drive|ct|court|pl|place|way|lane|ln|blvd|boulevard|cres|crescent|tce|terrace|pde|parade)$/i.test(w)
            );
            if (streetTypeIndex > 0 && streetTypeIndex < words.length - 1) {
              lastLocationData.suburb = words.slice(streetTypeIndex + 1).join(' ');
            }
          }
          
          lastLocationData.suburb = lastLocationData.suburb || statePostcodeMatch[1].trim();
          lastLocationData.state = statePostcodeMatch[2].toUpperCase();
          lastLocationData.postcode = statePostcodeMatch[3];
        } else {
          // Fallback: save the whole address as suburb if no pattern matches
          // This handles cases like "23 brune" where we can't extract specific parts
          console.log('No pattern matched, saving as fallback suburb:', singlePart);
          lastLocationData.suburb = singlePart;
        }
      }
      
      console.log('Extracted location data:', lastLocationData);
      localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(lastLocationData));
    } catch (error) {
      console.error('Failed to save last location:', error);
    }
  },

  loadLastLocation: (): LastLocationData => {
    try {
      const data = localStorage.getItem(LAST_LOCATION_KEY);
      console.log('loadLastLocation - Raw data from localStorage:', data);
      if (!data) {
        console.log('loadLastLocation - No data found');
        return {};
      }
      
      const parsed = JSON.parse(data);
      console.log('loadLastLocation - Parsed data:', parsed);
      return parsed;
    } catch (error) {
      console.error('Failed to load last location:', error);
      return {};
    }
  },

  saveSavedRoute: (route: SavedRoute): void => {
    try {
      const existingRoutes = storage.loadSavedRoutes();
      const updatedRoutes = existingRoutes.filter(r => r.id !== route.id);
      updatedRoutes.push(route);
      localStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(updatedRoutes));
    } catch (error) {
      console.error('Failed to save route:', error);
    }
  },

  loadSavedRoutes: (): SavedRoute[] => {
    try {
      const data = localStorage.getItem(SAVED_ROUTES_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load saved routes:', error);
      return [];
    }
  },

  deleteSavedRoute: (id: string): void => {
    try {
      const existingRoutes = storage.loadSavedRoutes();
      const updatedRoutes = existingRoutes.filter(r => r.id !== id);
      localStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(updatedRoutes));
    } catch (error) {
      console.error('Failed to delete saved route:', error);
    }
  }
};