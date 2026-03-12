# Backend

Express + BullMQ + Redis API for legal media processing.

## Features

- URL analysis with FFprobe
- Queue-based transcode jobs
- Real-time progress (Socket.IO + polling)
- Temporary file handling + automatic cleanup
- Security hardening (rate-limit, validation, CORS, Helmet)

## Prerequisites

- Node.js 20+
- Redis 7+
- FFmpeg installed system-wide (recommended for production)

## Setup

1. Copy environment file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start API:

```bash
npm run dev
```

4. Start worker (second terminal):

```bash
npm run worker
```

## API Summary

- `POST /api/analyze`
- `POST /api/download`
- `GET /api/progress/:jobId`
- `GET /api/file/:jobId`
- `GET /api/jobs/:jobId`
- `DELETE /api/jobs/:jobId`
