# Disaster Response Coordination Platform – Technical Specification

## Objective
A robust, backend-focused platform for disaster response, enabling real-time data aggregation, geospatial resource mapping, and secure, auditable workflows for contributors and administrators.

## Core Features

1. **Disaster Data Management**
   - Full CRUD for disaster records (title, location, description, tags, owner, audit trail, status).
   - Ownership and audit trail for all actions.
   - Status workflow: `pending`, `approved`, `rejected` (admin review required for publication).

2. **Location Extraction & Geocoding**
   - Use Google Gemini API to extract location names from descriptions.
   - Geocode location names to lat/lng using Nominatim (OpenStreetMap), Google Maps, or Mapbox.

3. **Geospatial Resource Mapping**
   - Use Supabase/PostGIS for geospatial queries (e.g., find resources within 10km).
   - Automatic and manual resource mapping; Overpass API with retry logic for reliability.

4. **Official Updates Aggregation (GDACS)**
   - The backend scrapes official disaster news from GDACS (https://gdacs.org/Knowledge/archivenews.aspx) using Cheerio.
   - Only the first page of news is fetched (no pagination).
   - REST endpoint: `GET /disasters/official-updates` returns the latest news as JSON.
   - WebSocket: emits `official_updates` event every 60 seconds with the latest news.
   - Frontend: `/official-updates` page fetches and displays these updates, with real-time UI updates.
   - Next.js API proxy: `/api/official-updates` forwards requests to the backend.

5. **Authentication & Authorization**
   - Mock authentication with hard-coded users and roles (admin, contributor).
   - JWT-based authentication and RBAC in production.

6. **Admin Review Workflow**
   - Contributors submit disasters (status: `pending`).
   - Admins receive email notifications, review via secure dashboard, and approve/reject with audit trail.
   - Disasters not reviewed within 7 days are auto-deleted by a scheduled cleanup script.
   - Only approved disasters are visible and trigger further actions (resource mapping).

7. **Frontend**
    - Minimal, modern UI (React/Next.js recommended) for disaster creation, status tracking, admin review, and real-time updates.
    - Accessible, responsive, and role-aware interface.

## Database Schema (Supabase/PostgreSQL)
- `disasters`: id, title, location_name, location (GEOGRAPHY), description, tags (TEXT[]), owner_id, status, created_at, audit_trail (JSONB)
- `reports`: id, disaster_id, user_id, content, image_url, created_at
- `resources`: id, disaster_id, name, location_name, location (GEOGRAPHY), type, created_at
- `cache`: key, value (JSONB), expires_at
- Indexes: GIST on location, GIN on tags, B-tree on owner_id

## API Endpoints
- `POST /disasters` – Create disaster (status: pending)
- `GET /disasters` – List disasters (filter by tag, status, owner)
- `PUT /disasters/:id` – Update disaster
- `DELETE /disasters/:id` – Delete disaster
- `POST /disasters/:id/approve` – Admin approve
- `POST /disasters/:id/reject` – Admin reject
- `GET /disasters/:id/resources` – Geospatial resource lookup
- `GET /disasters/official-updates` – Official updates
- `POST /geocode` – Location extraction and geocoding

## Real-Time & Caching
- WebSockets (Socket.IO): emit updates for disasters and resources.
- Supabase cache table for all external API responses (TTL: 1 hour).

## External Integrations
- **Mapping Service:** Nominatim (OpenStreetMap), Google Maps, or Mapbox for geocoding.
- **Official Updates:** Scraping with Cheerio.

## Security & Best Practices
- All endpoints require authentication and enforce RBAC.
- Input validation, secure file uploads, and structured logging.
- Sensitive credentials managed via environment variables.
- Audit trails for all critical actions.

## Scheduled Jobs
- Cleanup script deletes disasters with status `pending` older than 7 days (cron recommended).

## Bonus Features (Optional)
- Priority alert system for urgent reports (keyword-based).
- Classifier for report prioritization.
- Enhanced resource mapping (e.g., fetch hospitals near disaster).
- Custom frontend features (e.g., interactive map).

## Submission & Evaluation
- Push code to GitHub, deploy frontend (Vercel) and backend (Render), and submit with a note on Copilot/AI tool usage.
- Evaluation: Functionality (50%), Backend complexity (30%), Integrations (15%), Copilot usage (5%).

## Sample Data
- Disaster: `{ title: "NYC Flood", location_name: "Manhattan, NYC", description: "Heavy flooding in Manhattan", tags: ["flood", "urgent"], owner_id: "netrunnerX" }`
- Report: `{ disaster_id: "123", user_id: "citizen1", content: "Need food in Lower East Side", image_url: "http://example.com/flood.jpg" }`
- Resource: `{ disaster_id: "123", name: "Red Cross Shelter", location_name: "Lower East Side, NYC", type: "shelter" }`

## Notes
- Use mock data for testing and document any shortcuts or assumptions.
- Use Copilot/AI tools for code generation and note their impact in your submission.

---

Build fast, test thoroughly, and help coordinate disaster response! 🚀
