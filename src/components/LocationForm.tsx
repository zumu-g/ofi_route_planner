import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Clock, Timer, Plus, X, CalendarClock, Loader2 } from 'lucide-react';
import type { Location } from '../types';
import { geocodeAddress } from '../utils/geocoding';
import { searchAddresses, debounce, type AutocompleteResult } from '../utils/autocomplete';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '../utils/storage';

interface LocationFormProps {
  onAdd: (location: Location) => void;
  onCancel: () => void;
  editLocation?: Location;
}

// Detect if we're on a mobile device
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
};

export const LocationForm: React.FC<LocationFormProps> = ({ onAdd, onCancel, editLocation }) => {
  const [formData, setFormData] = useState<Partial<Location>>({
    address: '',
    name: '',
    duration: 30,
    buffer: 15,
    notes: '',
    type: 'openHome',
    ...editLocation,
  });

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [lastSuburb, setLastSuburb] = useState<string>('');
  const [currentSuburb, setCurrentSuburb] = useState<string>('');
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const addressContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate dropdown position based on available space
  const updateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return;
    const inputRect = inputRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;
    
    // On mobile with keyboard, prefer above if we're in bottom half
    if (isMobile() && spaceBelow < 200 && spaceAbove > spaceBelow) {
      setDropdownPosition('above');
    } else {
      setDropdownPosition('below');
    }
  }, []);
  
  // Scroll input into view when focused (iOS keyboard handling)
  const scrollInputIntoView = useCallback((element: HTMLElement) => {
    if (!isMobile()) return;
    
    // Small delay to let keyboard animate
    setTimeout(() => {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }, 300);
  }, []);

  useEffect(() => {
    if (!editLocation) {
      const savedSuburb = storage.loadLastSuburb();
      if (savedSuburb) {
        setLastSuburb(savedSuburb);
      }
    }
  }, [editLocation]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 3) {
        setSuggestions([]);
        setIsLoadingSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const results = await searchAddresses(query, true); // Filter to Victoria
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300),
    []
  );

  const handleAddressChange = (value: string) => {
    setFormData({ ...formData, address: value, coordinates: undefined });
    setCurrentSuburb('');
    
    // Trigger autocomplete search
    if (value.length >= 3) {
      setIsLoadingSuggestions(true);
      debouncedSearch(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    // Also handle the previous suburb suggestion logic
    if (lastSuburb && value.trim().length >= 2 && !value.includes(',')) {
      const words = value.trim().split(' ');
      const hasNumber = /^\d+/.test(words[0] || '');
      const hasStreetName = words.length >= 2;
      
      if (hasNumber && hasStreetName) {
        setCurrentSuburb(lastSuburb);
      }
    }
  };

  const handleSuggestionSelect = (suggestion: AutocompleteResult) => {
    setFormData({
      ...formData,
      address: suggestion.shortName,
      coordinates: {
        lat: suggestion.lat,
        lng: suggestion.lng,
      },
    });
    setSuggestions([]);
    setShowSuggestions(false);
    setCurrentSuburb('');
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address) return;
    
    setIsGeocoding(true);
    setGeocodeError(null);
    
    let coordinates = formData.coordinates;
    let hadGeocodeError = false;
    
    if (!coordinates) {
      const geocodeResult = await geocodeAddress(formData.address);
      if (geocodeResult) {
        coordinates = {
          lat: geocodeResult.lat,
          lng: geocodeResult.lng,
        };
      } else {
        // Set error message if geocoding failed
        hadGeocodeError = true;
        setGeocodeError('Could not find coordinates for this address. The location will be added without map coordinates.');
      }
    }
    
    setIsGeocoding(false);
    
    const location: Location = {
      id: editLocation?.id || Date.now().toString(),
      address: formData.address,
      name: formData.name,
      duration: formData.duration || 30,
      buffer: formData.buffer || 15,
      notes: formData.notes,
      type: formData.type as 'openHome' | 'appointment',
      coordinates,
      startTime: formData.startTime,
      endTime: formData.endTime,
      fixedTime: formData.type === 'openHome' ? formData.fixedTime : undefined,
    };
    
    // Extract and save the suburb/city for future prepopulation
    const addressParts = location.address.split(',');
    if (addressParts.length >= 2) {
      // Get the suburb/city part (usually after the first comma)
      const suburb = addressParts.slice(1).join(',').trim();
      if (suburb) {
        storage.saveLastSuburb(suburb);
      }
    }
    
    onAdd(location);
    
    // Clear error after a short delay if it was set
    if (hadGeocodeError) {
      setTimeout(() => setGeocodeError(null), 5000);
    }
  };

  // Generic focus handler for all inputs
  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    scrollInputIntoView(e.target);
  }, [scrollInputIntoView]);

  return (
    <motion.form
      ref={formRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card location-form-container"
      onSubmit={handleSubmit}
      style={{ position: 'relative' }}
    >
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <h3>{editLocation ? 'Edit Location' : 'Add New Location'}</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Location Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'openHome' | 'appointment' })}
            onFocus={handleInputFocus}
          >
            <option value="openHome">Open Home</option>
            <option value="appointment">Appointment</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Name (Optional)
          </label>
          <input
            type="text"
            inputMode="text"
            enterKeyHint="next"
            autoCapitalize="words"
            placeholder="e.g., Smith Residence"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onFocus={handleInputFocus}
          />
        </div>
        
        <div ref={addressContainerRef} style={{ position: 'relative' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Address
            {isLoadingSuggestions && (
              <Loader2 
                size={14} 
                style={{ 
                  display: 'inline', 
                  marginLeft: '8px',
                  animation: 'spin 1s linear infinite'
                }} 
              />
            )}
          </label>
          
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            enterKeyHint="done"
            placeholder={lastSuburb ? `e.g., 123 Main St, ${lastSuburb}` : "Start typing an address..."}
            value={formData.address || ''}
            onChange={(e) => handleAddressChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
              updateDropdownPosition();
              scrollInputIntoView(e.target);
            }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck="false"
            required
          />
          
          {/* Autocomplete suggestions dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                ref={suggestionsRef}
                className="autocomplete-dropdown"
                initial={{ opacity: 0, y: dropdownPosition === 'below' ? -10 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: dropdownPosition === 'below' ? -10 : 10 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  ...(dropdownPosition === 'below' ? {
                    top: '100%',
                    marginTop: '4px',
                  } : {
                    bottom: '100%',
                    marginBottom: '4px',
                  }),
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--color-border)',
                  zIndex: 9999,
                  overflow: 'hidden',
                  maxHeight: isMobile() ? '35vh' : '240px',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.placeId}
                    className="autocomplete-suggestion"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onTouchStart={() => setSelectedIndex(index)}
                    style={{
                      padding: isMobile() ? '14px 16px' : '12px 16px',
                      minHeight: isMobile() ? '52px' : 'auto',
                      cursor: 'pointer',
                      backgroundColor: selectedIndex === index 
                        ? 'rgba(0, 122, 255, 0.1)' 
                        : 'transparent',
                      borderBottom: index < suggestions.length - 1 
                        ? '1px solid var(--color-border)' 
                        : 'none',
                      transition: 'background-color 0.15s ease',
                      WebkitTapHighlightColor: 'rgba(0, 122, 255, 0.1)',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                    }}>
                      <MapPin 
                        size={16} 
                        style={{ 
                          color: 'var(--color-royal-blue)',
                          marginTop: '2px',
                          flexShrink: 0,
                        }} 
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '15px',
                          fontWeight: 500,
                          color: 'var(--color-text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {suggestion.shortName}
                        </div>
                        {suggestion.suburb && (
                          <div style={{
                            fontSize: '13px',
                            color: 'var(--color-text-tertiary)',
                            marginTop: '2px',
                          }}>
                            {[suggestion.suburb, suggestion.state, suggestion.postcode]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Live auto-population based on previously saved suburb */}
          {lastSuburb && !formData.address && !showSuggestions && (
            <div style={{
              fontSize: '13px',
              marginTop: '6px'
            }}>
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, address: `, ${lastSuburb}` });
                  setTimeout(() => {
                    if (inputRef.current) {
                      inputRef.current.focus();
                      inputRef.current.setSelectionRange(0, 0);
                    }
                  }, 0);
                }}
                style={{
                  fontSize: '12px',
                  padding: '4px 12px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📍 Use previous location: {lastSuburb}
              </button>
            </div>
          )}
          
          
          {/* Live auto-population - show as soon as user types */}
          {currentSuburb && formData.address && formData.address.trim().length >= 2 && !formData.address.includes(',') && !showSuggestions && (
            <div style={{
              fontSize: '13px',
              marginTop: '6px',
              padding: '8px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '4px',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                💡 Complete address: <strong>{formData.address}, {currentSuburb}</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  // Complete the address with the saved suburb
                  setFormData({ ...formData, address: `${formData.address}, ${currentSuburb}` });
                  setCurrentSuburb('');
                }}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                ✅ Use this address
              </button>
            </div>
          )}
          
          {/* Geocode error display */}
          {geocodeError && (
            <div style={{ 
              marginTop: 'var(--spacing-xs)', 
              padding: 'var(--spacing-sm)', 
              backgroundColor: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-secondary)',
              fontSize: '13px'
            }}>
              {geocodeError}
            </div>
          )}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="180"
              value={formData.duration || 30}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              <Timer size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Buffer (minutes)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={formData.buffer || 15}
              onChange={(e) => setFormData({ ...formData, buffer: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
        </div>
        
        {formData.type === 'openHome' && (
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              <CalendarClock size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Fixed Time (Optional)
            </label>
            <input
              type="time"
              value={formData.fixedTime || ''}
              onChange={(e) => setFormData({ ...formData, fixedTime: e.target.value })}
              placeholder="Leave empty for flexible scheduling"
            />
            <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
              Set if this OFI has a specific scheduled time (e.g., 11:00 AM open home)
            </p>
          </div>
        )}
        
        {formData.type === 'appointment' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime || ''}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime || ''}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>
        )}
        
        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Notes (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Any additional information..."
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            onFocus={handleInputFocus}
            enterKeyHint="done"
          />
        </div>
        
        <div className="form-actions" style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            <X size={18} />
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isGeocoding}>
            {isGeocoding ? (
              <>Loading...</>
            ) : (
              <>
                <Plus size={18} />
                {editLocation ? 'Update' : 'Add'} Location
              </>
            )}
          </button>
        </div>
      </div>
    </motion.form>
  );
};
