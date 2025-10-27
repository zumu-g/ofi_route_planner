import type { Location } from '../types';

const STORAGE_KEY = 'ofi-route-planner-locations';
const SETTINGS_KEY = 'ofi-route-planner-settings';
const LAST_SUBURB_KEY = 'ofi-route-planner-last-suburb';
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

  saveLastSuburb: (suburb: string): void => {
    try {
      console.log('🔍 storage.saveLastSuburb called with:', suburb);
      localStorage.setItem(LAST_SUBURB_KEY, suburb);
      console.log('🔍 Successfully saved to localStorage with key:', LAST_SUBURB_KEY);
    } catch (error) {
      console.error('Failed to save last suburb:', error);
    }
  },

  loadLastSuburb: (): string => {
    try {
      const result = localStorage.getItem(LAST_SUBURB_KEY) || '';
      console.log('🔍 storage.loadLastSuburb returning:', result);
      return result;
    } catch (error) {
      console.error('Failed to load last suburb:', error);
      return '';
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