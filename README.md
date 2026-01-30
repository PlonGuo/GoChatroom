# GoChatroom

A modern real-time chat application built with Go and React, featuring instant messaging, group chats, and video calling.

## Tech Stack

### Backend
- **Go 1.22** with Gin framework
- **GORM** for database ORM
- **MySQL** (PlanetScale) for data persistence
- **Redis** (Upstash) for caching and sessions
- **WebSocket** for real-time communication
- **JWT** for authentication
- **bcrypt** for password hashing

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and builds
- **Redux Toolkit** for state management
- **Ant Design** for UI components
- **WebRTC** for video calling

### Deployment
- **Fly.io** for backend hosting
- **Vercel** for frontend hosting
- **PlanetScale** for serverless MySQL
- **Upstash** for serverless Redis

## Features

- User registration and authentication
- Real-time messaging with WebSocket
- Private and group conversations
- Contact and friend management
- Friend request system
- Video calling with WebRTC
- User profile management
- Online status tracking

## Getting Started

### Prerequisites

- Go 1.22+
- Node.js 20+
- Docker and Docker Compose (for local development)

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/PlonGuo/GoChatroom.git
cd GoChatroom
```

2. Start the local database services:
```bash
docker-compose up -d
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the backend:
```bash
cd backend
go mod download
go run cmd/server/main.go
```

5. Run the frontend:
```bash
cd frontend
npm install
npm run dev
```

6. Open http://localhost:5173 in your browser

## Project Structure

```
GoChatroom/
├── backend/
│   ├── cmd/server/         # Application entry point
│   ├── internal/
│   │   ├── config/         # Configuration management
│   │   ├── database/       # Database connection
│   │   ├── handler/        # HTTP handlers
│   │   ├── middleware/     # Gin middleware
│   │   ├── model/          # Database models
│   │   ├── router/         # Route definitions
│   │   └── service/        # Business logic
│   ├── pkg/                # Shared packages
│   ├── docs/               # Backend documentation
│   ├── Dockerfile          # Container build
│   └── fly.toml            # Fly.io configuration
├── frontend/
│   ├── src/
│   │   ├── api/            # API services (axios)
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # WebSocket/WebRTC services
│   │   ├── store/          # Redux store and slices
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   └── vercel.json         # Vercel configuration
├── docker-compose.yml      # Local development services
└── CLAUDE.md               # Project guidelines
```

## Deployment

### Backend (Fly.io)

```bash
cd backend
flyctl launch
flyctl secrets set DATABASE_DSN="..." REDIS_URL="..." JWT_SECRET="..."
flyctl deploy
```

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Add environment variables:
   - `VITE_API_URL`: Your Fly.io backend URL
   - `VITE_WS_URL`: Your Fly.io WebSocket URL
4. Deploy

## Environment Variables

### Backend
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_DSN` | MySQL connection string | `user:pass@tcp(host:3306)/db` |
| `REDIS_URL` | Redis connection URL | `redis://user:pass@host:6379` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |
| `PORT` | Server port | `8080` |

### Frontend
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.example.com` |
| `VITE_WS_URL` | WebSocket URL | `wss://api.example.com` |

## API Documentation

See [backend/docs](backend/docs) for detailed API documentation including:
- Project structure overview
- Go and Gin framework basics
- GORM database operations
- Redis caching patterns
- Complete API endpoint reference

## License

MIT
