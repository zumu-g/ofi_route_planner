import type { Location } from '../types';

const STORAGE_KEY = 'ofi-route-planner-locations';
const SETTINGS_KEY = 'ofi-route-planner-settings';
const LAST_LOCATION_KEY = 'ofi-route-planner-last-location';

interface StorageData {
  locations: Location[];
  lastSaved: string;
  version: string;
}

interface Settings {
  useGoogleMapsDistances: boolean;
  googleMapsApiKey?: string;
}

interface LastLocationData {
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
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
      // Extract suburb/city from address
      const parts = address.split(',').map(p => p.trim());
      const lastLocationData: LastLocationData = {};
      
      if (parts.length >= 2) {
        // Assuming format: "123 Street, Suburb, City, State Postcode"
        // or "123 Street, City State Postcode"
        const lastPart = parts[parts.length - 1];
        const postcodeMatch = lastPart.match(/(\d{4,5})$/);
        
        if (postcodeMatch) {
          lastLocationData.postcode = postcodeMatch[1];
          const stateAndPostcode = lastPart;
          const state = stateAndPostcode.replace(postcodeMatch[1], '').trim();
          if (state) lastLocationData.state = state;
        }
        
        if (parts.length >= 3) {
          lastLocationData.city = parts[parts.length - 2];
          if (parts.length >= 4) {
            lastLocationData.suburb = parts[parts.length - 3];
          }
        } else if (parts.length === 2) {
          // Just street and city
          lastLocationData.city = parts[1].replace(/\s*\d{4,5}$/, '').replace(/\s+\w{2,3}$/, '').trim();
        }
      }
      
      localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(lastLocationData));
    } catch (error) {
      console.error('Failed to save last location:', error);
    }
  },

  loadLastLocation: (): LastLocationData => {
    try {
      const data = localStorage.getItem(LAST_LOCATION_KEY);
      if (!data) return {};
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load last location:', error);
      return {};
    }
  }
};