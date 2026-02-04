import type { Location, RouteSegment } from '../types';
import { format, parse, addMinutes } from 'date-fns';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export async function calculateDistance(from: Location, to: Location): Promise<{ distance: number; duration: number }> {
  if (!from.coordinates || !to.coordinates) {
    return { distance: 0, duration: 0 };
  }

  if (GOOGLE_MAPS_API_KEY) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${from.coordinates.lat},${from.coordinates.lng}&destinations=${to.coordinates.lat},${to.coordinates.lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      // Handle API errors
      if (data.status === 'REQUEST_DENIED') {
        const errorMessage = data.error_message || 'Unknown error';
        if (errorMessage.includes('API key') || errorMessage.includes('permission') || errorMessage.includes('expired')) {
          console.warn('Google Maps API: Authentication failed. The API key may be invalid, expired, or missing required permissions. Please check your VITE_GOOGLE_MAPS_API_KEY in .env.local');
        } else {
          console.warn('Google Maps API: Request denied. Check your API key and enable Distance Matrix API.');
        }
        // Fall through to Haversine calculation
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        console.warn('Google Maps API: Query limit exceeded. The app will use estimated distances.');
        // Fall through to Haversine calculation
      } else if (data.status === 'INVALID_REQUEST') {
        console.warn('Google Maps API: Invalid request. Check your coordinates.');
        // Fall through to Haversine calculation
      } else if (data.status === 'ZERO_RESULTS') {
        console.warn('Google Maps API: No route found between locations.');
        // Fall through to Haversine calculation
      } else if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        return {
          distance: element.distance.value / 1000, // Convert to km
          duration: element.duration.value / 60, // Convert to minutes
        };
      } else {
        console.warn('Google Maps API: Unexpected response status:', data.status, data.error_message || '');
        // Fall through to Haversine calculation
      }
    } catch (error) {
      console.error('Error fetching distance from Google Maps:', error);
      // Fall through to Haversine calculation
    }
  }

  // Fallback to Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = (to.coordinates.lat - from.coordinates.lat) * Math.PI / 180;
  const dLon = (to.coordinates.lng - from.coordinates.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(from.coordinates.lat * Math.PI / 180) * Math.cos(to.coordinates.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Estimate duration based on average speed of 40 km/h
  const duration = (distance / 40) * 60;
  
  return { distance, duration };
}

export async function optimizeRoute(locations: Location[], _startTime: string): Promise<Location[]> {
  if (locations.length <= 2) return locations;

  // Separate fixed-time and flexible locations
  const fixedTimeLocations = locations.filter(loc => loc.fixedTime);
  const flexibleLocations = locations.filter(loc => !loc.fixedTime);

  // Sort fixed-time locations by their scheduled time
  fixedTimeLocations.sort((a, b) => {
    const timeA = a.fixedTime || '00:00';
    const timeB = b.fixedTime || '00:00';
    return timeA.localeCompare(timeB);
  });

  // If all locations have fixed times, just return them sorted
  if (flexibleLocations.length === 0) {
    return fixedTimeLocations;
  }

  // If no fixed-time locations, use nearest neighbor for all
  if (fixedTimeLocations.length === 0) {
    const optimized: Location[] = [flexibleLocations[0]];
    const remaining = [...flexibleLocations.slice(1)];

    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const { distance } = await calculateDistance(current, remaining[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      optimized.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }

    return optimized;
  }

  // Mixed approach: place fixed-time locations first, then fill in flexible ones
  const result: Location[] = [];
  const remainingFlexible = [...flexibleLocations];

  // Insert fixed-time locations in order
  for (let i = 0; i < fixedTimeLocations.length; i++) {
    const fixedLoc = fixedTimeLocations[i];
    
    // Before first fixed location, add flexible locations that can fit before it
    if (i === 0) {
      // Find flexible locations that can fit before the first fixed time
      // Use nearest neighbor to optimize the order
      let currentPos = result.length > 0 ? result[result.length - 1] : null;
      
      while (remainingFlexible.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = Infinity;

        for (let j = 0; j < remainingFlexible.length; j++) {
          // Check if adding this flexible location would fit before the fixed time
          const flex = remainingFlexible[j];
          const dist = currentPos 
            ? (await calculateDistance(currentPos, flex)).distance 
            : 0;
          
          if (dist < nearestDistance) {
            nearestDistance = dist;
            nearestIndex = j;
          }
        }

        // Add the nearest flexible location
        result.push(remainingFlexible[nearestIndex]);
        currentPos = remainingFlexible[nearestIndex];
        remainingFlexible.splice(nearestIndex, 1);
        
        // Stop adding if we've estimated enough time
        if (result.length >= Math.ceil(flexibleLocations.length / (fixedTimeLocations.length + 1))) {
          break;
        }
      }
    }
    
    // Add the fixed-time location
    result.push(fixedLoc);
    
    // After each fixed location, try to add the nearest flexible locations
    if (remainingFlexible.length > 0 && i < fixedTimeLocations.length - 1) {
      // Calculate how many flexible locations can fit between this and next fixed location
      let currentPos = fixedLoc;
      
      // Add flexible locations using nearest neighbor
      const maxToAdd = Math.ceil(remainingFlexible.length / (fixedTimeLocations.length - i));
      let added = 0;
      
      while (remainingFlexible.length > 0 && added < maxToAdd) {
        let nearestIndex = 0;
        let nearestDistance = Infinity;

        for (let j = 0; j < remainingFlexible.length; j++) {
          const { distance } = await calculateDistance(currentPos, remainingFlexible[j]);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = j;
          }
        }

        result.push(remainingFlexible[nearestIndex]);
        currentPos = remainingFlexible[nearestIndex];
        remainingFlexible.splice(nearestIndex, 1);
        added++;
      }
    }
  }

  // Add any remaining flexible locations at the end using nearest neighbor
  while (remainingFlexible.length > 0) {
    const current = result[result.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < remainingFlexible.length; i++) {
      const { distance } = await calculateDistance(current, remainingFlexible[i]);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    result.push(remainingFlexible[nearestIndex]);
    remainingFlexible.splice(nearestIndex, 1);
  }

  return result;
}

export async function generateRouteSegments(
  locations: Location[],
  startTime: string
): Promise<RouteSegment[]> {
  const segments: RouteSegment[] = [];
  let currentTime = parse(startTime, 'HH:mm', new Date());

  // Handle first location's fixed time
  if (locations.length > 0 && locations[0].fixedTime) {
    currentTime = parse(locations[0].fixedTime, 'HH:mm', new Date());
  }

  for (let i = 0; i < locations.length - 1; i++) {
    const from = locations[i];
    const to = locations[i + 1];
    const { distance, duration } = await calculateDistance(from, to);

    const departureTime = addMinutes(currentTime, from.duration + from.buffer);
    let arrivalTime = addMinutes(departureTime, duration);

    // If destination has a fixed time, use that as the arrival time
    if (to.fixedTime) {
      const fixedArrival = parse(to.fixedTime, 'HH:mm', new Date());
      // Only use fixed time if it's after the calculated arrival time
      if (fixedArrival > arrivalTime) {
        arrivalTime = fixedArrival;
      }
    }

    segments.push({
      from,
      to,
      duration,
      distance,
      departureTime: format(departureTime, 'HH:mm'),
      arrivalTime: format(arrivalTime, 'HH:mm'),
    });

    currentTime = arrivalTime;
  }

  return segments;
}

export function calculateTotalDuration(segments: RouteSegment[], locations: Location[]): number {
  const travelTime = segments.reduce((sum, segment) => sum + segment.duration, 0);
  const locationTime = locations.reduce((sum, location) => sum + location.duration + location.buffer, 0);
  return travelTime + locationTime;
}

export function calculateTotalDistance(segments: RouteSegment[]): number {
  return segments.reduce((sum, segment) => sum + segment.distance, 0);
}

// Conflict Detection Types
export interface RouteConflict {
  type: 'late_arrival' | 'overlap' | 'insufficient_time';
  locationId: string;
  locationIndex: number;
  message: string;
  severity: 'warning' | 'error';
  details: {
    expectedArrival?: string;
    fixedTime?: string;
    timeDifferenceMinutes?: number;
    previousLocationId?: string;
  };
}

export interface ConflictSummary {
  hasConflicts: boolean;
  totalConflicts: number;
  errors: number;
  warnings: number;
  conflicts: RouteConflict[];
  affectedLocationIds: Set<string>;
}

/**
 * Detect conflicts and scheduling issues in the route
 */
export function detectRouteConflicts(
  locations: Location[],
  segments: RouteSegment[],
  startTime: string
): ConflictSummary {
  const conflicts: RouteConflict[] = [];
  const affectedLocationIds = new Set<string>();

  if (locations.length === 0) {
    return {
      hasConflicts: false,
      totalConflicts: 0,
      errors: 0,
      warnings: 0,
      conflicts: [],
      affectedLocationIds,
    };
  }

  // Calculate actual arrival times for each location
  let currentTime = parse(startTime, 'HH:mm', new Date());
  
  // Handle first location's fixed time
  if (locations[0].fixedTime) {
    const firstFixedTime = parse(locations[0].fixedTime, 'HH:mm', new Date());
    if (firstFixedTime < currentTime) {
      conflicts.push({
        type: 'late_arrival',
        locationId: locations[0].id,
        locationIndex: 0,
        message: `Start time ${startTime} is after fixed time ${locations[0].fixedTime}`,
        severity: 'error',
        details: {
          expectedArrival: startTime,
          fixedTime: locations[0].fixedTime,
          timeDifferenceMinutes: Math.round((currentTime.getTime() - firstFixedTime.getTime()) / 60000),
        },
      });
      affectedLocationIds.add(locations[0].id);
    }
    currentTime = firstFixedTime;
  }

  // Check each subsequent location
  for (let i = 0; i < locations.length - 1; i++) {
    const currentLocation = locations[i];
    const nextLocation = locations[i + 1];
    const segment = segments[i];

    if (!segment) continue;

    // Calculate departure from current location
    const departureTime = addMinutes(currentTime, currentLocation.duration + currentLocation.buffer);
    
    // Calculate arrival at next location
    const arrivalTime = addMinutes(departureTime, segment.duration);

    // Check if arrival is after the next location's fixed time
    if (nextLocation.fixedTime) {
      const fixedTime = parse(nextLocation.fixedTime, 'HH:mm', new Date());
      
      if (arrivalTime > fixedTime) {
        const timeDiff = Math.round((arrivalTime.getTime() - fixedTime.getTime()) / 60000);
        conflicts.push({
          type: 'late_arrival',
          locationId: nextLocation.id,
          locationIndex: i + 1,
          message: `Will arrive ${timeDiff} minutes late (at ${format(arrivalTime, 'HH:mm')}) for fixed time ${nextLocation.fixedTime}`,
          severity: timeDiff > 15 ? 'error' : 'warning',
          details: {
            expectedArrival: format(arrivalTime, 'HH:mm'),
            fixedTime: nextLocation.fixedTime,
            timeDifferenceMinutes: timeDiff,
            previousLocationId: currentLocation.id,
          },
        });
        affectedLocationIds.add(nextLocation.id);
      }
      
      // Update current time to fixed time (or arrival if later)
      currentTime = arrivalTime > fixedTime ? arrivalTime : fixedTime;
    } else {
      currentTime = arrivalTime;
    }
  }

  // Check for overlapping fixed times (same time scheduled for multiple locations)
  const fixedTimeLocations = locations.filter(loc => loc.fixedTime);
  const timeGroups = new Map<string, Location[]>();
  
  for (const loc of fixedTimeLocations) {
    const time = loc.fixedTime!;
    if (!timeGroups.has(time)) {
      timeGroups.set(time, []);
    }
    timeGroups.get(time)!.push(loc);
  }

  for (const [time, locs] of timeGroups) {
    if (locs.length > 1) {
      for (const loc of locs) {
        conflicts.push({
          type: 'overlap',
          locationId: loc.id,
          locationIndex: locations.findIndex(l => l.id === loc.id),
          message: `Multiple locations scheduled at ${time}`,
          severity: 'error',
          details: {
            fixedTime: time,
          },
        });
        affectedLocationIds.add(loc.id);
      }
    }
  }

  // Check for insufficient time between consecutive fixed appointments
  for (let i = 0; i < fixedTimeLocations.length - 1; i++) {
    const current = fixedTimeLocations[i];
    const next = fixedTimeLocations[i + 1];
    
    const currentTime = parse(current.fixedTime!, 'HH:mm', new Date());
    const nextTime = parse(next.fixedTime!, 'HH:mm', new Date());
    
    const availableMinutes = (nextTime.getTime() - currentTime.getTime()) / 60000;
    const requiredMinutes = current.duration + current.buffer;
    
    if (availableMinutes < requiredMinutes && availableMinutes > 0) {
      conflicts.push({
        type: 'insufficient_time',
        locationId: current.id,
        locationIndex: locations.findIndex(l => l.id === current.id),
        message: `Only ${Math.round(availableMinutes)} minutes before next appointment (need ${requiredMinutes} min)`,
        severity: 'warning',
        details: {
          fixedTime: current.fixedTime,
          timeDifferenceMinutes: Math.round(availableMinutes - requiredMinutes),
        },
      });
      affectedLocationIds.add(current.id);
    }
  }

  const errors = conflicts.filter(c => c.severity === 'error').length;
  const warnings = conflicts.filter(c => c.severity === 'warning').length;

  return {
    hasConflicts: conflicts.length > 0,
    totalConflicts: conflicts.length,
    errors,
    warnings,
    conflicts,
    affectedLocationIds,
  };
}

/**
 * Calculate travel time to return destination
 */
export async function calculateReturnTravelTime(
  lastLocation: Location,
  returnDestination: Location
): Promise<{ distance: number; duration: number; arrivalTime: string } | null> {
  if (!lastLocation || !returnDestination) {
    return null;
  }

  const { distance, duration } = await calculateDistance(lastLocation, returnDestination);
  
  return {
    distance,
    duration,
    arrivalTime: '', // Will be calculated based on departure time
  };
}