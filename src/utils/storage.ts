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
  defaultCountryCode?: string; // ISO country code for geocoding
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
      if (!data) return {};
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load last location:', error);
      return {};
    }
  }
};