# OFI Route Planner - Brand Style Guide

## Brand Identity

### Mission Statement
OFI Route Planner simplifies property viewing logistics with intelligent route optimization, helping real estate professionals and home buyers save time and make informed decisions.

### Brand Values
- **Efficiency**: Optimize every journey
- **Simplicity**: Clean, intuitive interface
- **Reliability**: Accurate calculations and seamless exports
- **Professional**: Built for real estate professionals

## Logo

### Primary Logo
The OFI Route Planner logo combines three key elements:
1. **Route Path**: A curved dashed line representing optimized journey
2. **Location Markers**: Three pins showing start, waypoint, and destination
3. **Tech Grid**: Subtle grid pattern suggesting precision and technology

### Logo Usage
- Minimum size: 32x32px for digital, 10mm for print
- Clear space: Equal to the height of one location marker around all sides
- Always maintain aspect ratio

### Logo Variations
- Full color (primary)
- Monochrome blue (#1e40af)
- White on dark backgrounds
- Grayscale for print

## Color Palette

### Primary Colors
```css
--color-primary: #1e40af;      /* Royal Blue - Main brand color */
--color-primary-light: #3b82f6; /* Light Blue - Accents and hover states */
--color-primary-dark: #1e3a8a;  /* Dark Blue - Active states */
```

### Neutral Colors
```css
--color-surface: #ffffff;       /* Pure White - Cards and surfaces */
--color-background: #fafafa;    /* Off White - Page background */
--color-border: #e5e5e5;        /* Light Gray - Borders */
--color-text: #333333;          /* Dark Gray - Primary text */
--color-text-secondary: #666666; /* Medium Gray - Secondary text */
--color-text-tertiary: #999999; /* Light Gray - Disabled text */
```

### Semantic Colors
```css
--color-success: #10b981;       /* Green - Success states */
--color-warning: #f59e0b;       /* Orange - Warning states */
--color-error: #ef4444;         /* Red - Error states */
--color-info: #3b82f6;          /* Blue - Information */
```

## Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
```

### Font Weights
- Light: 300 (Subtle text)
- Regular: 400 (Body text)
- Medium: 500 (UI elements)
- Semibold: 600 (Headings)

### Type Scale
```css
--font-size-xs: 12px;    /* Helper text */
--font-size-sm: 14px;    /* Secondary text */
--font-size-base: 16px;  /* Body text */
--font-size-lg: 18px;    /* Subheadings */
--font-size-xl: 24px;    /* Headings */
--font-size-2xl: 32px;   /* Page titles */
```

### Line Heights
- Headings: 1.2
- Body text: 1.5
- UI elements: 1.4

## Spacing System

Based on 8px grid system:
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-xxl: 48px;
```

## UI Components

### Buttons
```css
/* Primary Button */
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-border);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
}
```

### Cards
```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: var(--spacing-lg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
```

### Form Elements
```css
input, select, textarea {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: var(--font-size-base);
  transition: border-color 0.2s;
}

input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}
```

## Iconography

### Icon Library
- **Lucide React**: Primary icon set
- Size: 18-24px for UI, 32-64px for empty states
- Stroke width: 1.5-2px
- Color: Inherit from parent text color

### Common Icons
- **Navigation**: Map pin, Navigation arrow, Route
- **Actions**: Plus, Edit, Delete, Download
- **Time**: Clock, Calendar, Timer
- **Views**: List, Map, Grid

## Motion & Animation

### Transitions
```css
/* Default transition */
transition: all 0.2s ease-out;

/* Hover effects */
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
```

### Page Transitions
- Fade: 200ms opacity transition
- Slide: 300ms transform transition
- Use Framer Motion for complex animations

## Responsive Design

### Breakpoints
```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Wide desktop */
```

### Mobile Considerations
- Touch targets: Minimum 44x44px
- Increased padding on mobile
- Stack elements vertically on small screens
- Simplified navigation

## Voice & Tone

### Writing Style
- **Clear**: Use simple, direct language
- **Professional**: Maintain business-appropriate tone
- **Helpful**: Guide users with actionable messages
- **Concise**: Get to the point quickly

### UI Copy Examples
- Empty state: "No locations added yet"
- CTA: "Add Location" not "Create New Location"
- Error: "Address not found. Please check and try again."
- Success: "Route optimized!"

## Accessibility

### Color Contrast
- Text on background: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- Interactive elements: Clear focus states

### Keyboard Navigation
- All interactive elements keyboard accessible
- Visible focus indicators
- Logical tab order
- Skip links where appropriate

### ARIA Labels
- Descriptive labels for screen readers
- Proper heading hierarchy
- Form field labels and error messages

## Implementation Examples

### Header Component
```jsx
<header style={{
  backgroundColor: 'var(--color-surface)',
  borderBottom: '1px solid var(--color-border)',
  padding: 'var(--spacing-lg)',
}}>
  <h1>OFI Route Planner</h1>
  <p className="text-secondary">Plan your open home visits efficiently</p>
</header>
```

### Button Examples
```jsx
<button className="btn-primary">
  <Plus size={18} />
  Add Location
</button>

<button className="btn-secondary">
  <Navigation size={18} />
  Optimize Route
</button>
```

### Empty State
```jsx
<div className="card text-center">
  <Map size={64} color="var(--color-text-tertiary)" />
  <h3>No locations added yet</h3>
  <p className="text-secondary">
    Start by adding your first location
  </p>
</div>
```

## File Formats

### Logo Files
- SVG: Primary format for all uses
- PNG: 512x512px for app icons
- ICO: Multi-resolution favicon

### Brand Assets Location
- `/public/logo.svg` - Primary logo
- `/public/favicon.ico` - Favicon
- `/src/assets/` - Other brand assets

---

*Last updated: October 2024*