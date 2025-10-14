import type { Location } from '../types';

const STORAGE_KEY = 'ofi-route-planner-locations';
const SETTINGS_KEY = 'ofi-route-planner-settings';
const LAST_LOCATION_KEY = 'ofi-route-planner-last-location-v4'; // Changed key to force fresh start
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
    // SUPER SIMPLE V4 - Just save the whole address
    console.log('[V4] Saving address:', address);
    
    // Just save it directly - no parsing
    const data = { fullAddress: address };
    const json = JSON.stringify(data);
    
    console.log('[V4] Saving to localStorage:', json);
    localStorage.setItem(LAST_LOCATION_KEY, json);
    
    // Verify immediately
    const check = localStorage.getItem(LAST_LOCATION_KEY);
    console.log('[V4] Verified in storage:', check);
  },

  loadLastLocation: (): LastLocationData => {
    console.log('[V4] Loading last location');
    const data = localStorage.getItem(LAST_LOCATION_KEY);
    console.log('[V4] Raw from storage:', data);
    
    if (!data) {
      console.log('[V4] No data found');
      return {};
    }
    
    try {
      const parsed = JSON.parse(data);
      console.log('[V4] Parsed:', parsed);
      
      // Handle new format
      if (parsed.fullAddress) {
        console.log('[V4] Using fullAddress:', parsed.fullAddress);
        return { suburb: parsed.fullAddress };
      }
      
      // Fallback for any old format
      return parsed;
    } catch (error) {
      console.error('[V4] Parse error:', error);
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