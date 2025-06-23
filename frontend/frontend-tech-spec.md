# Frontend Technical Specification – Disaster Response Coordination Platform

## Stack
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **Icons:** Lucide or Heroicons
- **Maps:** Mapbox GL JS or Leaflet
- **WebSocket:** socket.io-client
- **Authentication:** JWT-based, role-aware UI (admin/contributor)

## Design Principles
- Minimal, modern, and accessible UI inspired by Vercel, Linear, and Notion
- Desktop-first with responsive mobile support
- Modular, reusable components and pages
- Clear feedback for all user actions (forms, API, real-time updates)
- Secure, role-based navigation and access

## Layout & Pages
- **Main Layout:**
  - Sticky top navbar or sidebar (desktop)
  - Collapsible drawer for mobile
  - Auth-aware navigation (login/register or user info/logout)
- **Pages:**
  - `/` – Dashboard: all disasters
  - `/create` – Disaster creation form
  - `/disaster/[id]` – Disaster details, reports, resources
  - `/official-updates` – Aggregated official updates
  - `/login` – User login
  - `/register` – User registration
  - `/contributions` – User's disaster submissions (status-aware)

## Core Components
- **DisasterCard:** Title, location, tags, created date, actions (View, Edit if allowed)
- **DisasterForm:** Title, location (name/description), tags, description, geocode button, map preview
- **ReportForm:** Content, image URL, preview, submit
- **AuthForm:** Login/register, error/success feedback
- **UserMenu:** User info, role, logout, admin badge
- **LiveFeed:** Real-time social media, reports, resources (WebSocket)
- **ResourceMap:** Map with resource markers, type-based coloring

## UI/UX Details
- **Desktop:** Max width (`max-w-6xl mx-auto`), grid layout, pinned navigation
- **Mobile:** Hamburger nav, stacked forms, Tailwind responsive classes
- **Design System:**
  - Cards: `bg-white rounded-2xl shadow-md p-4`
  - Inputs: `input input-bordered w-full`
  - Buttons: `bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700`
  - Tags: `inline-block bg-blue-100 text-blue-700 rounded-full px-2 py-1 text-sm`
  - Alerts: `bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400 p-3`
  - Auth Badge: `inline-block bg-green-100 text-green-700 rounded-full px-2 py-1 text-xs ml-2`

## Functional Requirements
- **Authentication:**
  - Login, register, logout flows
  - Role-based UI (admin/contributor)
- **Disaster Management:**
  - Create, view, and (if allowed) edit disasters
  - Contributors see only their submissions on `/contributions`, with status badges
  - Admins access review dashboard (not `/contributions`)
- **Admin Review:**
  - Admin dashboard for reviewing, approving, or rejecting disasters
  - Status and admin info displayed for each disaster
- **Resource Integration:**
  - Map and list of resources per disaster
  - Real-time resource updates via WebSocket
- **Official Updates:**
  - Aggregated feed from GDACS (first page only)

## Official Updates Page
- `/official-updates` displays the latest official disaster news from GDACS.
- Fetches updates via `/api/official-updates` (Next.js API proxy).
- Listens for real-time updates via WebSocket (`official_updates` event).
- UI updates in real time and is wrapped in the main `Layout` for consistent navigation.

## Accessibility & Best Practices
- All interactive elements are keyboard accessible
- ARIA labels and roles for forms, buttons, and alerts
- Responsive and mobile-friendly design
- Secure handling of JWT and user data

---

This frontend spec ensures a modern, secure, and user-friendly interface that fully exercises the backend's disaster management, review, and resource mapping capabilities.

