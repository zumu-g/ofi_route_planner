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
      console.log('[v3] SIMPLE: Saving address:', address);
      
      // Simple approach: just save the full address
      // We'll extract meaningful parts for display
      const lastLocationData: LastLocationData = {};
      
      // Always save the full address as a fallback
      lastLocationData.suburb = address;
      
      // Try to extract state and postcode if they exist
      const statePostcodeMatch = address.match(/\b(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\s*(\d{4})$/i);
      if (statePostcodeMatch) {
        lastLocationData.state = statePostcodeMatch[1].toUpperCase();
        lastLocationData.postcode = statePostcodeMatch[2];
        
        // Remove state and postcode from suburb
        lastLocationData.suburb = address.replace(/\s*(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\s*\d{4}$/i, '').trim();
      }
      
      // If address has comma, take part after last comma as location hint
      const parts = address.split(',');
      if (parts.length > 1) {
        const lastPart = parts[parts.length - 1].trim();
        // If last part doesn't have state/postcode, use it as suburb
        if (!statePostcodeMatch) {
          lastLocationData.suburb = lastPart;
        }
      }
      
      console.log('[v3] SIMPLE: Saving data:', lastLocationData);
      localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(lastLocationData));
      
      // Verify it saved
      const saved = localStorage.getItem(LAST_LOCATION_KEY);
      console.log('[v3] SIMPLE: Verified in localStorage:', saved);
    } catch (error) {
      console.error('[v3] Failed to save last location:', error);
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