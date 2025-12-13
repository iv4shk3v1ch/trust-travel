# TrustTravel Design System

**Version:** 1.0  
**Last Updated:** December 13, 2025

---

## 🎨 Design Philosophy

TrustTravel uses a clean, modern, and user-friendly design that emphasizes:
- **Clarity** - Easy to read and navigate
- **Consistency** - Same patterns across all pages
- **Accessibility** - Clear contrast and readable text
- **Modern** - Contemporary design with rounded corners and subtle shadows

---

## 🎯 Color Palette

### Primary Colors
```
Blue (Primary Brand Color):
- blue-50:  #eff6ff  (Backgrounds, hover states)
- blue-100: #dbeafe  (Light accents)
- blue-600: #2563eb  (Primary actions, links) ⭐ Main Brand Color
- blue-700: #1d4ed8  (Hover states)
- blue-900: #1e3a8a  (Dark accents)

Purple (Secondary Accent):
- purple-600: #9333ea (Gradients, special highlights)
```

### Neutral Colors (Gray Scale)
```
Background Colors:
- gray-50:  #f9fafb  (Page backgrounds) ⭐ Main Background
- white:    #ffffff  (Card backgrounds, modals)

Border Colors:
- gray-200: #e5e7eb  (Card borders, dividers) ⭐ Main Border
- gray-300: #d1d5db  (Input borders, subtle separators)

Text Colors:
- gray-900: #111827  (Primary text - headings, important text) ⭐ Main Text
- gray-700: #374151  (Secondary text - descriptions)
- gray-600: #4b5563  (Tertiary text - labels, hints)
- gray-500: #6b7280  (Muted text - placeholders)
```

### Semantic Colors
```
Success (Green):
- green-500: #22c55e  (Success states, positive actions)
- green-50:  #f0fdf4  (Success backgrounds)

Error (Red):
- red-500:   #ef4444  (Selected markers, errors)
- red-600:   #dc2626  (Error actions, delete)
- red-50:    #fef2f2  (Error backgrounds)

Warning (Yellow):
- yellow-600: #ca8a04  (Warnings, alerts)
- yellow-50:  #fefce8  (Warning backgrounds)
```

### Score-Based Colors (for place matching)
```
- green-500 (#10b981):  80%+ match (Excellent)
- purple-600 (#8b5cf6): 65-79% match (Great)
- orange-500 (#f59e0b): 50-64% match (Good)
- gray-600 (#6b7280):   <50% match (Okay)
```

---

## 📝 Typography

### Font Family
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```
**Rationale:** Uses system fonts for optimal performance and native look.

### Font Sizes & Weights

#### Headings
```
Page Title (h1):
- text-2xl (24px) / font-bold (700)
- Color: gray-900
- Usage: Main page headings

Section Title (h2):
- text-xl (20px) / font-semibold (600)
- Color: gray-900
- Usage: Section headers

Card Title (h3):
- text-lg (18px) / font-semibold (600)
- Color: gray-900
- Usage: Card headers, modal titles

Subsection (h4):
- text-base (16px) / font-semibold (600)
- Color: gray-900
- Usage: Form section headers
```

#### Body Text
```
Primary Text:
- text-base (16px) / font-normal (400)
- Color: gray-900
- Usage: Main content, descriptions

Secondary Text:
- text-sm (14px) / font-normal (400)
- Color: gray-600 or gray-700
- Usage: Supporting information, labels

Small Text:
- text-xs (12px) / font-normal (400)
- Color: gray-500 or gray-600
- Usage: Hints, captions, metadata
```

#### Special Text
```
Links:
- text-blue-600 / hover:text-blue-700
- font-medium (500)
- Underline on hover (optional)

Labels:
- text-sm / font-medium (500)
- Color: gray-700
```

---

## 🔲 Spacing System

### Consistent Spacing Values
```
Micro spacing:    space-y-1  (4px)   - Between related small items
Small spacing:    space-y-2  (8px)   - Between form fields
Medium spacing:   space-y-3  (12px)  - Between form sections
Standard spacing: space-y-4  (16px)  - Between cards, sections
Large spacing:    space-y-6  (24px)  - Between major sections
Extra large:      space-y-8  (32px)  - Between page sections
```

### Padding Standards
```
Card padding:     p-4   (16px)   - Standard card interior
Button padding:   px-4 py-2      - Standard buttons
Small padding:    p-3   (12px)   - Compact cards
Form padding:     p-6   (24px)   - Form containers (AVOID - prefer p-4)
```

### Margin Standards
```
Section margins:  mb-6  (24px)   - Between page sections
Card margins:     mb-4  (16px)   - Between cards
Element margins:  mb-3  (12px)   - Between form elements
Small margins:    mb-1  (4px)    - Between label and input
```

---

## 🎁 Component Library

### 1. Buttons

#### Primary Button (Main Actions)
```jsx
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
  Primary Action
</button>
```
**Usage:** Save, Submit, Continue, Login, Main CTAs

#### Secondary Button (Alternative Actions)
```jsx
<button className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors">
  Cancel
</button>
```
**Usage:** Cancel, Back, Secondary actions

#### Icon Button (With Icon + Text)
```jsx
<button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
  <svg className="w-5 h-5">...</svg>
  <span>Action</span>
</button>
```

#### Floating Action Button (FAB)
```jsx
<button className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-30 transition-all">
  <svg className="w-6 h-6">...</svg>
</button>
```
**Usage:** Quick actions, add buttons

#### Filter/Toggle Button
```jsx
<button className="px-3 py-1.5 border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 rounded-full text-sm font-medium transition-all">
  Filter Option
</button>

{/* Active state */}
<button className="px-3 py-1.5 border-2 border-blue-600 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
  Active Filter
</button>
```

### 2. Cards

#### Standard Card
```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
  <h3 className="text-base font-semibold text-gray-900 mb-3">
    Card Title
  </h3>
  <p className="text-sm text-gray-600">
    Card content goes here
  </p>
</div>
```
**Key Features:**
- `rounded-xl` (12px radius) - Modern rounded corners
- `shadow-sm` - Subtle elevation
- `border border-gray-200` - Light border for definition
- `p-4` - Compact padding (16px)

#### Place Card (Specific Example)
```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
  {/* Image */}
  <div className="aspect-video bg-gray-100">
    <img src="..." alt="..." className="w-full h-full object-cover" />
  </div>
  
  {/* Content */}
  <div className="p-4">
    <h3 className="font-semibold text-gray-900 mb-1">Place Name</h3>
    <p className="text-sm text-gray-600">Description</p>
  </div>
</div>
```

### 3. Inputs & Forms

#### Text Input
```jsx
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Label Name
  </label>
  <input 
    type="text"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
    placeholder="Placeholder text"
  />
</div>
```

#### Textarea
```jsx
<textarea
  rows={3}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
  placeholder="Enter text..."
/>
```

#### Select Dropdown
```jsx
<select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
  <option value="">Select option</option>
  <option value="1">Option 1</option>
</select>
```

### 4. Navigation Components

#### Back Button (Standard Pattern)
```jsx
<button 
  onClick={() => router.push('/explore')}
  className="flex items-center text-gray-600 hover:text-blue-600 transition mb-6"
>
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
</button>
```
**Alternative Text Version:**
```jsx
<button 
  onClick={() => router.push('/explore')}
  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
>
  <span>←</span>
  <span className="text-sm font-medium">Back to Explore</span>
</button>
```

#### Breadcrumb Pattern
```jsx
<div className="text-sm text-gray-600 mb-4">
  <Link href="/explore" className="hover:text-blue-600">Explore</Link>
  <span className="mx-2">/</span>
  <span className="text-gray-900">Current Page</span>
</div>
```

### 5. Modals & Overlays

#### Modal Container
```jsx
{/* Backdrop */}
<div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
  
  {/* Modal */}
  <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
    
    {/* Header */}
    <div className="border-b border-gray-200 p-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">Modal Title</h2>
      <button className="text-gray-400 hover:text-gray-600">
        <svg className="w-6 h-6">...</svg>
      </button>
    </div>
    
    {/* Content */}
    <div className="p-4">
      Content goes here
    </div>
    
    {/* Footer (optional) */}
    <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
      <button className="...">Cancel</button>
      <button className="...">Confirm</button>
    </div>
    
  </div>
</div>
```

#### Bottom Sheet (Mobile)
```jsx
<div className="fixed left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-20 transition-all duration-300">
  {/* Drag Handle */}
  <div className="w-full py-3 flex justify-center">
    <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
  </div>
  
  {/* Content */}
  <div className="px-4 pb-4">
    Content
  </div>
</div>
```

### 6. Loading States

#### Spinner
```jsx
<div className="flex items-center justify-center py-8">
  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
</div>
```

#### Skeleton Card
```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
  <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
</div>
```

### 7. Alert/Toast Messages

#### Info Alert
```jsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <div className="flex items-start">
    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3">...</svg>
    <div>
      <h3 className="font-medium text-blue-900 mb-1">Info Title</h3>
      <p className="text-sm text-blue-700">Info message</p>
    </div>
  </div>
</div>
```

#### Error Alert
```jsx
<div className="bg-red-50 border border-red-200 rounded-lg p-3">
  <p className="text-red-600 text-sm">Error message</p>
</div>
```

---

## 📐 Layout Patterns

### Page Container
```jsx
<div className="min-h-screen bg-gray-50">
  <Header />
  
  <main className="max-w-4xl mx-auto px-4 py-6">
    {/* Page content */}
  </main>
  
  <Footer />
</div>
```
**Standard max-width:** `max-w-4xl` (896px)  
**Wide pages:** `max-w-6xl` (1152px)  
**Full width:** `max-w-[1920px]`

### Two-Column Layout (Desktop)
```jsx
{/* Desktop: 2/3 list + 1/3 map */}
<div className="hidden lg:flex gap-6">
  <div className="w-2/3">
    {/* Main content */}
  </div>
  <div className="w-1/3">
    {/* Sidebar */}
  </div>
</div>
```

### Mobile-First Responsive
```jsx
{/* Mobile: Full width */}
<div className="w-full lg:w-2/3">
  Content
</div>

{/* Hide on mobile, show on desktop */}
<div className="hidden lg:block">
  Desktop only
</div>

{/* Show on mobile, hide on desktop */}
<div className="lg:hidden">
  Mobile only
</div>
```

---

## 🎭 Interactive States

### Hover Effects
```css
hover:bg-gray-50      /* Subtle background change */
hover:border-blue-600  /* Border color change */
hover:text-blue-600   /* Text color change */
hover:shadow-md       /* Elevation increase */

/* Combine with transition */
transition-all duration-200
transition-colors
transition-shadow
```

### Focus States
```css
focus:ring-2 focus:ring-blue-500 focus:border-blue-500
/* Blue ring for accessibility */
```

### Active/Selected States
```css
/* Selected card */
border-2 border-blue-600 bg-blue-50

/* Selected button */
bg-blue-600 text-white

/* Active tab */
border-b-2 border-blue-600 text-blue-600
```

---

## 🎯 Icons & Emojis

### Icon Sizes
```
Small:   w-4 h-4   (16px)  - Inline with text
Medium:  w-5 h-5   (20px)  - Standard buttons
Large:   w-6 h-6   (24px)  - Headers, emphasis
X-Large: w-8 h-8   (32px)  - Feature icons
```

### Emoji Usage
**Preferred for:**
- Category icons (🍽️ 🎨 🏰)
- Map markers
- Quick visual indicators

**Not preferred for:**
- Interactive elements (use SVG)
- Critical UI elements

---

## 📱 Responsive Breakpoints

```css
sm:  640px   /* Small tablets */
md:  768px   /* Tablets */
lg:  1024px  /* Laptops - Main desktop breakpoint ⭐ */
xl:  1280px  /* Large desktops */
2xl: 1536px  /* Extra large screens */
```

**Primary breakpoint:** `lg:` (1024px) - Mobile vs Desktop

---

## ✨ Animation & Transitions

### Standard Transitions
```css
transition-colors duration-200  /* Color changes */
transition-all duration-300     /* Multiple properties */
transition-transform duration-300 /* Transforms */
```

### Common Animations
```css
animate-spin          /* Loading spinners */
animate-pulse         /* Skeleton loading */
hover:scale-105       /* Subtle zoom on hover */
transform-gpu         /* Hardware acceleration */
```

---

## 🚫 Dark Mode

**Current Status:** NO DARK MODE  
**Rationale:** Removed all `dark:` classes for consistency  
**Future:** May be added later as optional feature

---

## 📋 Reusable Components List

### Available in `/shared/components/`
1. ✅ **Header** - Top navigation bar
2. ✅ **Footer** - Bottom footer
3. ✅ **Button** - Standardized buttons (needs update to blue)
4. ✅ **Input** - Form inputs
5. ✅ **ProfileDrawer** - User profile sidebar

### Need to Create
1. ❌ **BackButton** - Standardized back navigation
2. ❌ **Card** - Reusable card component
3. ❌ **Modal** - Standard modal wrapper
4. ❌ **LoadingSpinner** - Consistent loading state
5. ❌ **Alert** - Toast/alert messages

---

## 🎨 Design Checklist for New Pages

When creating a new page, ensure:

- [ ] Uses `bg-gray-50` for page background
- [ ] Includes `<Header />` and `<Footer />`
- [ ] Uses `max-w-4xl mx-auto px-4 py-6` for content container
- [ ] All buttons use blue-600 (not indigo)
- [ ] Cards use `rounded-xl shadow-sm border border-gray-200 p-4`
- [ ] Text colors: gray-900 (headings), gray-700 (body), gray-600 (labels)
- [ ] Font sizes: text-2xl (h1), text-lg (h3), text-sm (labels)
- [ ] Spacing: space-y-4 between sections, mb-6 between major blocks
- [ ] Inputs have `focus:ring-2 focus:ring-blue-500`
- [ ] Interactive elements have `transition-colors` or `transition-all`
- [ ] No dark mode classes (no `dark:` prefixes)
- [ ] Mobile responsive with `lg:` breakpoint
- [ ] Loading states use blue-600 spinner
- [ ] Back button redirects to `/explore`

---

## 🔄 Migration from Indigo to Blue

**Old (Indigo):**
```css
indigo-600, indigo-700, indigo-50
```

**New (Blue):**
```css
blue-600, blue-700, blue-50
```

**Find and replace needed in:**
- Button component (already done for some pages)
- Older pages not yet updated
- Any custom styles

---

## 📝 Example: Complete Page Template

```jsx
'use client';

import { Header } from '@/shared/components/Header';
import { Footer } from '@/shared/components/Footer';
import { useRouter } from 'next/navigation';

export default function ExamplePage() {
  const router = useRouter();

  return (
    <>
      <Header />
      
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* Back Button */}
          <button 
            onClick={() => router.push('/explore')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition mb-6"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Page Title
            </h1>
            <p className="text-gray-600">
              Page description
            </p>
          </div>
          
          {/* Main Content Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Section Title
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Content goes here
            </p>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Primary Action
              </button>
              <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors">
                Cancel
              </button>
            </div>
          </div>
          
        </div>
      </div>
      
      <Footer />
    </>
  );
}
```

---

**END OF DESIGN SYSTEM**
