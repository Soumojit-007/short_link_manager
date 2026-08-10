# Short Link Manager

A complete production-quality full-stack application for managing and tracking short links.

## Prerequisites
- Node.js (v18+)
- PostgreSQL (or NeonDB)

## Project Structure
- `/backend`: Node.js, Express.js, TypeScript, PostgreSQL (Prisma ORM)
- `/frontend`: React 19, TypeScript, Vite, Tailwind CSS, React Router, Recharts

## Setup Instructions

### 1. Database & Environment Setup
1. Clone this repository.
2. In the `/backend` directory, create a `.env` file from the example:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Update `DATABASE_URL` in `backend/.env` with your PostgreSQL connection string.

### 2. Backend Setup
```bash
cd backend
npm install
# Run Prisma migrations
npx prisma migrate dev --name init
# Start the backend development server
npm run dev
```
The backend will run at `http://localhost:3000`.

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
# Start the frontend development server
npm run dev
```
The frontend will run at `http://localhost:5173`.

## Testing
To run the backend integration tests (which cover URL validation, creation, concurrency-safe clicking, and atomic caps):
```bash
cd backend
npm test
```

## API Endpoints Overview
- `POST /api/links`: Create a new short link.
- `GET /api/links`: List links (paginated & search).
- `GET /api/links/:id`: Get link details.
- `GET /api/links/:id/stats`: Get 7-day click statistics.
- `PATCH /api/links/:id/disable`: Disable a link.
- `DELETE /api/links/:id`: Delete a link.
- `GET /r/:slug`: Redirect endpoint (tracks clicks).
