# Disaster Response Coordination Platform

A full-stack MERN application for disaster response, featuring real-time data aggregation, geospatial queries, social media monitoring, and AI-powered location/image analysis.

## Features
- Disaster CRUD (Supabase/PostgreSQL)
- Location extraction (Google Gemini API) & geocoding (OpenStreetMap Nominatim)
- Real-time social media monitoring (Bluesky API with mock fallback, Supabase caching)
- Geospatial resource mapping (Supabase geospatial queries)
- Official updates aggregation (web scraping)
- Image verification (Google Gemini API)
- WebSockets for real-time updates
- Supabase caching for API responses (TTL: 1 hour)
- Structured logging with Pino
- **Rate limiting** on all major endpoints (per-IP, per-route, in-memory)
- **Fallback logic** for all external APIs (cache, mock data, or error response)
- **Role-based access** (admin/contributor, with admin set manually in Supabase)
- **Modern Next.js frontend** with:
  - Minimal, aesthetic UI (Vercel/Linear-inspired, Tailwind CSS)
  - Responsive, desktop-first layout
  - Resource map with filtering, search, and pagination
  - Sticky map and resource controls for easy navigation
  - Auth flows, protected routes, and role-based UI
  - Real-time updates via Socket.IO

## Tech Stack
- Node.js, Express.js, TypeScript
- Supabase (PostgreSQL, JavaScript SDK)
- Socket.IO
- Google Gemini API, OpenStreetMap Nominatim
- Pino (structured logging)
- **Frontend:** Next.js, Tailwind CSS, React, Leaflet, Lucide/Heroicons

## Setup
1. Clone the repo and install dependencies:
   ```bash
   npm install
   # (cd frontend && npm install) for frontend
   ```
2. Create a `.env` file in `/backend` with:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   BLUESKY_IDENTIFIER=your_bluesky_username
   BLUESKY_PASSWORD=your_bluesky_password
   PORT=4000
   ```
3. Build and run the backend:
   ```bash
   npm run build && npm start
   # or for development
   npm run dev
   ```
4. For the frontend:
   ```bash
   cd frontend
   npm run dev
   # Visit http://localhost:3000
   ```
5. Test API endpoints and UI (see below).

## API Endpoints
- `POST /disasters` — Create disaster
- `GET /disasters?tag=...` — List disasters (filter by tag)
- `PUT /disasters/:id` — Update disaster (owner only)
- `DELETE /disasters/:id` — Delete disaster (admin only)
- `GET /disasters/:id/social-media` — Get social media posts (Bluesky, fallback to mock, cached, rate-limited)
- `POST /geocode` — Extract and geocode location from description (Gemini + OSM, cached, rate-limited)
- `GET /disasters/:id/resources?lat=...&lon=...` — Geospatial resource lookup (Supabase RPC, cached, rate-limited)
- `GET /disasters/:id/official-updates` — Official updates (FEMA scraping, cached, rate-limited)
- `POST /disasters/:id/verify-image` — Image verification (Gemini, cached, rate-limited)
- `GET /disasters/:id/external-resources` — External resources (Overpass API, cached, rate-limited)
- Reports endpoints: create/update/delete (owner only)

## Frontend Highlights
- **Dashboard:** List all disasters, view, create, and manage
- **Disaster View:**
  - Disaster info, tags, and description
  - Interactive resource map with custom icons
  - Resource list with search, filter, and paginated navigation
  - Sticky controls for map and resource list (desktop)
- **Authentication:** Login, register, role-based UI, protected routes
- **Live updates:** Real-time resource and report updates via WebSocket
- **Image verification:** Upload or paste image URL for AI authenticity check
- **Official updates:** Aggregated news from FEMA, Red Cross, etc.

## API Endpoint Access Control

| Endpoint                                      | Method | Access Level                |
|-----------------------------------------------|--------|----------------------------|
| /disasters                                    | POST   | Authenticated user         |
| /disasters                                    | GET    | Public                     |
| /disasters/:id                                | PUT    | Owner only                 |
| /disasters/:id                                | DELETE | Admin only                 |
| /disasters/:id/social-media                   | GET    | Public                     |
| /geocode                                      | POST   | Public                     |
| /disasters/:id/official-updates               | GET    | Public                     |
| /disasters/:id/verify-image                   | POST   | Public                     |
| /disasters/:id/external-resources             | GET    | Public                     |
| /disasters/:id/resources?lat=...&lon=...      | GET    | Public                     |
| /disasters/:id/reports                        | POST   | Authenticated user         |
| /disasters/:id/reports/:rid                   | PUT    | Owner only                 |
| /disasters/:id/reports/:rid                   | DELETE | Owner only                 |
| /auth/register                                | POST   | Public                     |
| /auth/login                                   | POST   | Public                     |

- **Authenticated user**: Any logged-in user (JWT required)
- **Owner only**: Only the creator/owner of the resource
- **Admin only**: Only users with the admin role
- **Public**: No authentication required

Refer to this table to determine which routes should be protected in the frontend.

## Frontend Route Protection

Use the following guidelines to protect frontend routes and UI elements:

- **Public**: No protection needed. Anyone can access these pages or actions.
- **Authenticated user**: Protect with login. Only logged-in users (with a valid JWT) can access these pages or perform these actions.
- **Owner only**: Protect with login and ownership check. Only the creator/owner of the resource can access or modify. UI should hide or disable actions for non-owners.
- **Admin only**: Protect with login and admin role check. Only users with the admin role can access or perform these actions. UI should hide or disable actions for non-admins.

### Example Mapping

| Frontend Page/Action                | Protection Type         |
|-------------------------------------|------------------------|
| View disasters list                 | Public                 |
| Create disaster                     | Authenticated user     |
| Edit disaster                       | Owner only             |
| Delete disaster                     | Admin only             |
| View social media, geocode, updates | Public                 |
| Submit report                       | Authenticated user     |
| Edit/delete report                  | Owner only             |
| Register/login                      | Public                 |

**Tip:** Use your `UserContext`, `ProtectedRoute`, and role checks in the frontend to enforce these protections. Hide or disable UI elements for users who lack the required permissions.

## Project Structure
- `/backend/src/controllers` — API controllers
- `/backend/src/models` — Data models
- `/backend/src/routes` — Express routes
- `/backend/src/utils` — Utilities (Supabase client, logger, etc.)
- `/backend/src/middleware` — Auth, rate limiting, etc.
- `/frontend` — Next.js frontend (see `frontend-tech-spec.md` for UI details)

## Notes
- All disaster data is stored in Supabase/PostgreSQL.
- Social media, geocode, and resource results are cached in Supabase for 1 hour.
- **Rate limiting** is enforced on all major endpoints to prevent abuse (10 requests/minute per IP per route by default).
- **Fallback logic**: If an external API fails, the app will return cached data if available, or mock data for social media, or a clear error message.
- **Role-based access**: Registration creates contributors by default; set `role = 'admin'` manually in Supabase for admin access.
- Structured logging is enabled for all major events and errors.
- See `tech-spec.md` and `frontend-tech-spec.md` for full requirements and sample data.

---

Built with ❤️ using GitHub Copilot.
