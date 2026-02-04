import type { Location } from '../types';

export interface HistoryState {
  locations: Location[];
  timestamp: number;
}

export interface HistoryManager {
  past: HistoryState[];
  future: HistoryState[];
}

const MAX_HISTORY_SIZE = 20;

export function createHistoryManager(): HistoryManager {
  return {
    past: [],
    future: [],
  };
}

export function pushState(
  history: HistoryManager,
  locations: Location[]
): HistoryManager {
  const newState: HistoryState = {
    locations: JSON.parse(JSON.stringify(locations)), // Deep clone
    timestamp: Date.now(),
  };

  const newPast = [...history.past, newState];
  
  // Keep only the last MAX_HISTORY_SIZE states
  if (newPast.length > MAX_HISTORY_SIZE) {
    newPast.shift();
  }

  return {
    past: newPast,
    future: [], // Clear future when new action is performed
  };
}

export function undo(
  history: HistoryManager,
  currentLocations: Location[]
): { history: HistoryManager; locations: Location[] | null } {
  if (history.past.length === 0) {
    return { history, locations: null };
  }

  const newPast = [...history.past];
  const previousState = newPast.pop()!;
  
  const currentState: HistoryState = {
    locations: JSON.parse(JSON.stringify(currentLocations)),
    timestamp: Date.now(),
  };

  return {
    history: {
      past: newPast,
      future: [currentState, ...history.future],
    },
    locations: previousState.locations,
  };
}

export function redo(
  history: HistoryManager,
  currentLocations: Location[]
): { history: HistoryManager; locations: Location[] | null } {
  if (history.future.length === 0) {
    return { history, locations: null };
  }

  const newFuture = [...history.future];
  const nextState = newFuture.shift()!;
  
  const currentState: HistoryState = {
    locations: JSON.parse(JSON.stringify(currentLocations)),
    timestamp: Date.now(),
  };

  return {
    history: {
      past: [...history.past, currentState],
      future: newFuture,
    },
    locations: nextState.locations,
  };
}

export function canUndo(history: HistoryManager): boolean {
  return history.past.length > 0;
}

export function canRedo(history: HistoryManager): boolean {
  return history.future.length > 0;
}
