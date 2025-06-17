# Disaster Response Coordination Platform

A backend-heavy MERN stack application for disaster response, featuring real-time data aggregation, geospatial queries, social media monitoring, and AI-powered location/image analysis.

## Features
- Disaster CRUD (Supabase/PostgreSQL)
- Location extraction & geocoding (Google Gemini API, mapping service)
- Real-time social media monitoring (mock/real Twitter, Bluesky)
- Geospatial resource mapping (Supabase geospatial queries)
- Official updates aggregation (web scraping)
- Image verification (Google Gemini API)
- WebSockets for real-time updates
- Supabase caching for API responses

## Tech Stack
- Node.js, Express.js, TypeScript
- Supabase (PostgreSQL, JavaScript SDK)
- Socket.IO
- Google Gemini API, mapping service (Google Maps/Mapbox/OSM)
- (Frontend: minimal, not included here)

## Setup
1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in `/backend` with:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=4000
   ```
3. Build and run the backend:
   ```bash
   npm run build && npm start
   # or for development
   npm run dev
   ```
4. Test API endpoints (see below).

## API Endpoints
- `POST /disasters` — Create disaster
- `GET /disasters?tag=...` — List disasters (filter by tag)
- `PUT /disasters/:id` — Update disaster
- `DELETE /disasters/:id` — Delete disaster
- (More endpoints: social media, resources, updates, verification, geocoding)

## Project Structure
- `/backend/src/controllers` — API controllers
- `/backend/src/models` — Data models
- `/backend/src/routes` — Express routes
- `/backend/src/utils` — Utilities (Supabase client, etc.)

## Notes
- All disaster data is stored in Supabase/PostgreSQL.
- See `tech-spec.md` for full requirements and sample data.

---

Built with ❤️ using GitHub Copilot.
