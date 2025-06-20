# 🌐 Frontend UI Specification: Disaster Response Coordination Platform

## 🧩 Stack
- **Framework:** [Next.js](https://nextjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide](https://lucide.dev/) or [Heroicons](https://heroicons.com/)
- **Maps:** [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/guides/) or [Leaflet](https://leafletjs.com/)
- **WebSocket:** `socket.io-client`
- **Authentication:** JWT-based, login/register UI, role-based UI (admin/contributor)

---

## 🎯 Design Goals
- **Minimal, aesthetic UI** – inspired by Vercel, Linear, and Notion
- **Desktop-first experience** with responsive adjustments for mobile
- **Modular pages/components** to test full backend functionality
- **Authentication flows** (login, register, logout, role-based UI)
- **Focus on functionality** with clean UX (forms, API feedback, real-time updates)

---

## 📐 Layout & Pages

### 1. **Main Layout**
- Sticky top navigation bar or sidebar on desktop
- Mobile: collapsible drawer/nav icon
- **Auth-aware navigation** (show login/register or user info/logout)

### 2. **Pages**

| Route                | Purpose                                         |
|----------------------|-------------------------------------------------|
| `/`                  | Dashboard with all disasters                   |
| `/create`            | Form to create a disaster                      |
| `/disaster/[id]`     | View specific disaster, reports, resources     |
| `/verify-image`      | Image verification using Gemini API            |
| `/official-updates`  | Aggregated updates from FEMA, Red Cross, etc.  |
| `/login`             | User login                                     |
| `/register`          | User registration                              |

---

## 🧱 Core UI Components

### ✅ DisasterCard
- Shows title, location, tags, created date
- Button: `View`, `Edit`

### 📝 DisasterForm
- Title, Location Name/Description, Tags (multi), Description
- `Geocode` button → `/geocode` API
- Optional: auto-map preview

### 🧾 ReportForm
- Fields: content, image URL
- Image preview
- Submit → `/reports`

### 🔐 AuthForm
- Login/register forms
- Fields: username, password (register: +email)
- Error/success feedback
- Submit → `/auth/login` or `/auth/register`

### 👤 UserMenu
- Shows logged-in user, role, and logout button
- Admin badge if applicable

### 🛰️ LiveFeed
- WebSocket real-time stream
- Social media alerts, new reports, resources

### 🗺️ ResourceMap
- Map + resource list
- Query `/resources` with lat/lng
- Colored markers by type (shelter, hospital, etc.)

### 🖼️ ImageVerifier
- Input: image URL
- Output: Gemini response (Authentic / Manipulated)
- Prompted via `/verify-image`

---

## 🪄 UI Details

### 💻 Desktop-First
- Max-width: `xl` (e.g., `max-w-6xl mx-auto`)
- Grid-based layout (2-3 columns)
- Navigation pinned on left or top

### 📱 Mobile Responsive
- Collapse nav to hamburger
- Stack forms vertically
- Tailwind `sm:`, `md:`, `lg:` responsive classes

---

## 🎨 Design System

| Element     | Style Example                            |
|-------------|------------------------------------------|
| Cards       | `bg-white rounded-2xl shadow-md p-4`     |
| Inputs      | `input input-bordered w-full` (Tailwind forms) |
| Buttons     | `bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700` |
| Tags        | `inline-block bg-blue-100 text-blue-700 rounded-full px-2 py-1 text-sm` |
| Alerts      | `bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400 p-3` |
| Auth Badge  | `inline-block bg-green-100 text-green-700 rounded-full px-2 py-1 text-xs ml-2` |

