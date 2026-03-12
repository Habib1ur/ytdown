# MediaForge - Legal Media Processing Platform

Production-grade platform for media transformation of content you own or are authorized to process.

Core capabilities:

- URL-based media analysis (metadata extraction)
- Video and audio transcoding jobs
- Queue-based processing with retries and concurrency controls
- Real-time progress updates (WebSocket + polling fallback)
- Temporary artifact storage with automatic expiration cleanup
- Redis-backed cache and job state tracking
- Secure API surface with URL validation, rate-limiting, CORS, bot checks, and hardened headers

## 1. Folder Structure

```text
youtube-downloader/
	frontend/
		src/
			app/
			components/
			lib/
		.env.example
		package.json
		tailwind.config.js
	backend/
		src/
			controllers/
			middlewares/
			queue/
			routes/
			services/
			utils/
			workers/
			app.js
			config.js
			index.js
		.env.example
		package.json
	config/
		deployment-ubuntu.md
		ecosystem.config.cjs
		nginx-mediaforge.conf
	scripts/
		start-dev.ps1
		install-yt-dlp.md
	docker-compose.yml
	README.md
```

## 2. Architecture

```text
Client (Next.js + Tailwind)
		-> API Gateway (Express)
		-> Download Controller
		-> Queue (BullMQ + Redis)
		-> Worker Process
		-> FFprobe/FFmpeg
		-> Temporary File Storage
		-> Streamed download endpoint
```

## 3. API Endpoints

### POST /api/analyze

Input:

```json
{
	"url": "https://cdn.example.com/video.mp4"
}
```

Output:

```json
{
	"title": "Media Title",
	"thumbnail": null,
	"duration": 123.4,
	"formats": [
		{ "type": "video", "quality": "720p", "size": null },
		{ "type": "audio", "quality": "mp3", "size": null }
	]
}
```

### POST /api/download

Input:

```json
{
	"url": "https://cdn.example.com/video.mp4",
	"format": "video",
	"quality": "720p"
}
```

Output:

```json
{
	"jobId": "<bullmq-job-id>",
	"status": "queued"
}
```

### GET /api/progress/:jobId

Output:

```json
{
	"jobId": "123",
	"status": "processing",
	"progress": 57,
	"error": null
}
```

### GET /api/file/:jobId

- Streams the finished artifact as an attachment when ready.
- Returns 409 if still processing.
- Returns 410 if file expired.

Additional job management:

- GET /api/jobs/:jobId
- DELETE /api/jobs/:jobId

## 4. Queue and Worker Design

- Queue: BullMQ with Redis.
- Worker pulls jobs with configurable concurrency.
- Retry policy: exponential backoff.
- Progress updates:
	- Worker parses FFmpeg stderr time markers.
	- Writes progress into Redis and BullMQ job progress.
	- API broadcasts events via Socket.IO queue event listeners.
- Completion path:
	- Store output file path and metadata in Redis.
	- Expose file through authenticated API route only.

## 5. Security Model

- URL validation with protocol checks.
- Optional domain allowlist for approved source hosts.
- Request payload schema validation (Zod).
- Rate limiting (global + download endpoint).
- Helmet security headers.
- Strict CORS origin control.
- Body size limits.
- Basic bot protection:
	- Honeypot field validation.
	- Optional shared secret token.
- Temporary file isolation in job-specific folders.

## 6. File Lifecycle

- Artifacts stored in backend temp directory by job ID.
- Redis stores expiration timestamp per job.
- Cleanup scheduler scans tracked jobs and deletes expired files/folders.
- Direct filesystem access is not publicly exposed.

## 7. Local Installation and Run

### Prerequisites

- Node.js 20+
- Redis 7+
- FFmpeg installed (or ffmpeg-static fallback)

### Start Redis

Option A (Docker):

```bash
docker compose up -d redis
```

Option B (local service): install Redis and run service normally.

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Start worker in another terminal:

```bash
cd backend
npm run worker
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open: http://localhost:3000

## 8. Production Deployment

See complete guide: `config/deployment-ubuntu.md`

Includes:

- Ubuntu setup
- Node runtime installation
- PM2 process manager
- Nginx reverse proxy
- SSL via Let's Encrypt

## 9. Performance Notes

- Streaming file response avoids loading full artifact in memory.
- Redis cache for analyze responses.
- Compression enabled in API.
- Queue concurrency controls prevent overload.
- Frontend uses progressive UI states and fallback polling.

## 10. Legal Scope

This implementation is for authorized media workflows only. Ensure rights, licensing, and platform terms compliance for all content sources.
