# Disaster Response Coordination Platform

A modern, secure, and collaborative platform for disaster reporting, resource mapping, and real-time coordination between contributors and administrators.

## Features

- **Disaster Reporting:**
  - Intuitive form for users to submit disaster reports with geolocation, tags, and images.
  - Contributors can track the status of their submissions (pending, approved, rejected) on a dedicated `/contributions` page.
- **Admin Review Workflow:**
  - Admins review, approve, or reject disaster reports with full audit trail and action history.
  - Secure admin dashboard with status filtering, pagination, and contributor/admin info.
- **Resource Mapping:**
  - Automatic and manual resource mapping using Overpass API with retry logic for reliability.
- **Authentication & Authorization:**
  - Secure JWT-based authentication for users and admins.
  - Role-based access control (RBAC) throughout the platform.
- **Notifications:**
  - Email notifications to admins for new submissions.
  - (Optional) Contributor notifications for approval/rejection.
- **Modern UI/UX:**
  - Responsive, accessible, and user-friendly interface with real-time feedback and status badges.
- **Security:**
  - Input validation, secure file uploads, and best practices for API and data protection.

## Official Disaster News (GDACS)

- The backend scrapes the latest official disaster news from the GDACS website (https://gdacs.org/Knowledge/archivenews.aspx) using Cheerio.
- Only the first page of news is fetched (no pagination).
- The backend exposes a REST endpoint at `/disasters/official-updates` that returns the latest news as JSON.
- The backend emits real-time updates via WebSocket (`official_updates` event) every 60 seconds with the latest news.
- The frontend fetches and displays these updates on the `/official-updates` page, with real-time UI updates and a consistent navbar.
- The frontend uses a Next.js API proxy route (`/api/official-updates`) to forward requests to the backend.

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL (with PostGIS for geospatial data)
- **Authentication:** JWT, secure cookies
- **APIs:** Overpass API (OpenStreetMap), Nominatim
- **Cloud Storage:** Google Cloud Storage (for images)

## Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL (with PostGIS extension)
- Google Cloud Storage credentials (for image uploads)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/DRC_Platform.git
cd DRC_Platform
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env # Fill in DB, JWT, GCS, and email config
npm install
npm run migrate # Run DB migrations
npm run dev # Start backend server
```

### 3. Frontend Setup
```bash
cd ../frontend
cp .env.example .env # Set NEXT_PUBLIC_BACKEND_URL
npm install
npm run dev # Start frontend (Next.js)
```

### 4. Database
- Ensure PostgreSQL is running and the PostGIS extension is enabled.
- Run provided migrations to set up tables and indices.

### 5. Google Cloud Storage
- Place your `gcs-key.json` in `backend/` and configure the path in `.env`.

### 6. Email (Admin Notifications)
- Configure SMTP settings in backend `.env` for email notifications.

## Usage
- **Contributors:**
  - Register, log in, and submit disaster reports via the form.
  - Track submission status on `/contributions`.
- **Admins:**
  - Log in to access the admin dashboard for reviewing, approving, or rejecting reports.
  - View audit trails and contributor/admin info for each disaster.

## Troubleshooting

- If you see a WebSocket connection error, ensure the backend is running and accessible at the correct port (default: 4000).
- The backend and frontend must use compatible Socket.IO versions.
- For local development, set `NEXT_PUBLIC_BACKEND_URL` in the frontend `.env` to `http://localhost:4000`.

## Security Best Practices
- All API endpoints require authentication.
- Role-based access enforced on both frontend and backend.
- File uploads are validated and securely stored.
- Sensitive credentials are never committed to the repository.

## Development & Contribution
- Follow conventional commit messages and code style guidelines.
- Use environment variables for all secrets and configuration.
- PRs are welcome! Please open issues for feature requests or bugs.

## License
MIT License. See [LICENSE](LICENSE) for details.

---

For questions or support, contact the maintainers or open an issue on GitHub.
