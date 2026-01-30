# GoChatroom

Real-time chat application with React frontend and Go backend.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Redux Toolkit + Ant Design |
| Backend | Go + Gin + GORM |
| Database | MySQL (PlanetScale) |
| Cache | Redis (Upstash) |
| WebRTC | Metered.ca TURN |
| Deploy | Vercel + Fly.io |

## Project Structure

```
GoChatroom/
├── backend/           # Go API server
│   ├── cmd/server/    # Entry point
│   └── internal/      # Business logic
├── frontend/          # React SPA
│   └── src/
└── docker-compose.yml # Local dev environment
```

## Getting Started

### Prerequisites

- Go 1.21+
- Node.js 20+
- Docker & Docker Compose

### Local Development

```bash
# Start MySQL + Redis
docker-compose up -d

# Run backend
cd backend && go run cmd/server/main.go

# Run frontend
cd frontend && npm install && npm run dev
```

## Features

- User registration and authentication
- Real-time messaging via WebSocket
- Group chat support
- Contact management
- Video/audio calls via WebRTC
- File sharing

## License

MIT
