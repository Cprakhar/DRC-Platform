# Disaster Response Coordination Platform

A backend-heavy MERN stack application for disaster response, featuring real-time data aggregation, geospatial queries, social media monitoring, and AI-powered location/image analysis.

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

## Tech Stack
- Node.js, Express.js, TypeScript
- Supabase (PostgreSQL, JavaScript SDK)
- Socket.IO
- Google Gemini API, OpenStreetMap Nominatim
- Pino (structured logging)
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
4. Test API endpoints (see below).

## API Endpoints
- `POST /disasters` — Create disaster
- `GET /disasters?tag=...` — List disasters (filter by tag)
- `PUT /disasters/:id` — Update disaster
- `DELETE /disasters/:id` — Delete disaster
- `GET /disasters/:id/social-media` — Get social media posts (Bluesky, fallback to mock, cached)
- `POST /geocode` — Extract and geocode location from description (Gemini + OSM, cached)

## Project Structure
- `/backend/src/controllers` — API controllers
- `/backend/src/models` — Data models
- `/backend/src/routes` — Express routes
- `/backend/src/utils` — Utilities (Supabase client, logger, etc.)

## Notes
- All disaster data is stored in Supabase/PostgreSQL.
- Social media and geocode results are cached in Supabase for 1 hour.
- Structured logging is enabled for all major events and errors.
- See `tech-spec.md` for full requirements and sample data.

---

Built with ❤️ using GitHub Copilot.
