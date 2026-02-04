import type { Location, CalendarEvent, ExportOptions } from '../types';
import { format, parse } from 'date-fns';

export function createCalendarEvent(location: Location, date: string, startTime: string): CalendarEvent {
  const baseDate = parse(date, 'yyyy-MM-dd', new Date());
  const [hours, minutes] = startTime.split(':').map(Number);
  
  const startDate = new Date(baseDate);
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + location.duration);
  
  return {
    title: location.name || location.address,
    location: location.address,
    startDate,
    endDate,
    notes: location.notes,
  };
}

export function generateICSContent(events: CalendarEvent[]): string {
  const icsLines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OFI Route Planner//EN',
    'CALSCALE:GREGORIAN',
  ];
  
  events.forEach(event => {
    icsLines.push(
      'BEGIN:VEVENT',
      `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@ofirouteplanner.com`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(event.startDate)}`,
      `DTEND:${formatICSDate(event.endDate)}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `LOCATION:${escapeICS(event.location)}`
    );
    
    if (event.notes) {
      icsLines.push(`DESCRIPTION:${escapeICS(event.notes)}`);
    }
    
    icsLines.push('END:VEVENT');
  });
  
  icsLines.push('END:VCALENDAR');
  
  return icsLines.join('\r\n');
}

function formatICSDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss");
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generateGoogleCalendarURL(event: CalendarEvent): string {
  const startDate = format(event.startDate, "yyyyMMdd'T'HHmmss");
  const endDate = format(event.endDate, "yyyyMMdd'T'HHmmss");
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startDate}/${endDate}`,
    location: event.location,
  });
  
  if (event.notes) {
    params.append('details', event.notes);
  }
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function exportCalendarEvents(
  events: CalendarEvent[],
  options: ExportOptions
): void {
  switch (options.format) {
    case 'ics':
      const icsContent = generateICSContent(events);
      downloadFile('route-schedule.ics', icsContent, 'text/calendar');
      break;
      
    case 'google':
      // For Google Calendar, we'll open multiple tabs
      events.forEach((event, index) => {
        setTimeout(() => {
          window.open(generateGoogleCalendarURL(event), '_blank');
        }, index * 500); // Delay to prevent popup blocking
      });
      break;
      
    case 'apple':
      // Apple Calendar uses ICS format
      const appleIcsContent = generateICSContent(events);
      downloadFile('route-schedule.ics', appleIcsContent, 'text/calendar');
      break;
  }
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Create a calendar event for the return trip
 */
export function createReturnEvent(
  returnDestination: Location,
  date: string,
  departureTime: string,
  travelDurationMinutes: number
): CalendarEvent {
  const baseDate = parse(date, 'yyyy-MM-dd', new Date());
  const [hours, minutes] = departureTime.split(':').map(Number);
  
  const startDate = new Date(baseDate);
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + travelDurationMinutes);
  
  return {
    title: `Return to ${returnDestination.name || 'Office/Home'}`,
    location: returnDestination.address,
    startDate,
    endDate,
    notes: `Travel time: ${Math.round(travelDurationMinutes)} minutes`,
  };
}