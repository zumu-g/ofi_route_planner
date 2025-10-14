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
      
      if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
        const element = data.rows[0].elements[0];
        return {
          distance: element.distance.value / 1000, // Convert to km
          duration: element.duration.value / 60, // Convert to minutes
        };
      }
    } catch (error) {
      console.error('Error fetching distance from Google Maps:', error);
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

export async function optimizeRoute(locations: Location[]): Promise<Location[]> {
  if (locations.length <= 2) return locations;

  // Simple nearest neighbor algorithm
  const optimized: Location[] = [locations[0]];
  const remaining = [...locations.slice(1)];

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

export async function generateRouteSegments(
  locations: Location[],
  startTime: string
): Promise<RouteSegment[]> {
  const segments: RouteSegment[] = [];
  let currentTime = parse(startTime, 'HH:mm', new Date());

  for (let i = 0; i < locations.length - 1; i++) {
    const from = locations[i];
    const to = locations[i + 1];
    const { distance, duration } = await calculateDistance(from, to);

    const departureTime = addMinutes(currentTime, from.duration + from.buffer);
    const arrivalTime = addMinutes(departureTime, duration);

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