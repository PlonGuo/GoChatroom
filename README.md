# GoChatroom

A modern real-time chat application built with Go and React, featuring instant messaging, group chats, and video calling.

## Live Demo

~~**Try it out:** [https://frontend-three-pied-39.vercel.app](https://frontend-three-pied-39.vercel.app)~~


Create an account and add me as a friend to test the chat and video calling features!
**My Username:** `PlonGuo`

## Tech Stack

### Backend

- **Go 1.23+** with Gin framework
- **GORM** for database ORM
- **PostgreSQL** for data persistence (supports MySQL as well)
- **Redis** (Upstash) for caching and sessions
- **WebSocket** for real-time communication
- **WebRTC** with TURN server support for video calling
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
- **Neon/Supabase/Railway** for PostgreSQL hosting
- **Upstash** for serverless Redis

## Features

- User registration and authentication
- Real-time messaging with WebSocket
- Private and group conversations
- Contact and friend management
- Friend request system
- Video calling with WebRTC and TURN server support
- User profile management
- Online status tracking
- Cyberpunk theme mode

## Getting Started

### Prerequisites

- Go 1.23+
- Node.js 20.19+ or 22.12+ (Node 21 is not supported)
- Docker and Docker Compose (for local development)

### Local Development

#### Step 1: Clone the Repository

```bash
git clone https://github.com/PlonGuo/GoChatroom.git
cd GoChatroom
```

#### Step 2: Start Database Services

Start PostgreSQL and Redis containers using Docker Compose:

```bash
docker-compose up -d
```

This starts:

- **PostgreSQL 16** on port `5433` (credentials: `gochatroom:gochatroom`)
- **Redis 7** on port `6379`

Verify the containers are running:

```bash
docker-compose ps
```

#### Step 3: Configure Environment Variables

Copy the example environment file to the backend directory:

```bash
cp .env.example backend/.env
```

The default values work out of the box for local development:

| Variable          | Default Value           | Description                              |
| ----------------- | ----------------------- | ---------------------------------------- |
| `APP_ENV`         | `development`           | Environment mode                         |
| `PORT`            | `8080`                  | Backend server port                      |
| `DB_HOST`         | `127.0.0.1`             | Database host (use IP, not localhost)    |
| `DB_PORT`         | `5433`                  | PostgreSQL port (Docker mapped to 5433)  |
| `DB_USER`         | `gochatroom`            | Database username                        |
| `DB_PASSWORD`     | `gochatroom`            | Database password                        |
| `DB_NAME`         | `gochatroom`            | Database name                            |
| `REDIS_HOST`      | `localhost`             | Redis host                               |
| `REDIS_PORT`      | `6379`                  | Redis port                               |
| `CORS_ORIGINS`    | `http://localhost:5173` | Allowed frontend origins                 |
| `JWT_SECRET`      | `your-secret-key...`    | JWT signing key                          |
| `TURN_SERVER_URL` | (optional)              | TURN server URL for WebRTC NAT traversal |
| `TURN_USERNAME`   | (optional)              | TURN server username                     |
| `TURN_PASSWORD`   | (optional)              | TURN server password                     |

#### Step 4: Run the Backend

```bash
cd backend
go mod download
go run cmd/server/main.go
```

The backend will:

1. Connect to MySQL and run migrations
2. Connect to Redis
3. Start the WebSocket hub
4. Listen on `http://localhost:8080`

#### Step 5: Run the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend development server starts on `http://localhost:5173` with hot reload enabled.

#### Step 6: Access the Application

| Service     | URL                    |
| ----------- | ---------------------- |
| Frontend    | http://localhost:5173  |
| Backend API | http://localhost:8080  |
| WebSocket   | ws://localhost:8080/ws |

Open http://localhost:5173 in your browser to use the application.

#### Stopping Services

```bash
# Stop frontend/backend: Ctrl+C in their terminals

# Stop and remove database containers
docker-compose down

# Stop containers but keep data volumes
docker-compose stop
```

#### Troubleshooting

| Issue                       | Solution                                                          |
| --------------------------- | ----------------------------------------------------------------- |
| Database access denied      | Use `DB_HOST=127.0.0.1` instead of `localhost` (forces TCP)       |
| Port 5433 already in use    | Change `DB_PORT` in `.env` or stop the conflicting service        |
| Port 6379 already in use    | Stop local Redis: `redis-cli shutdown`                            |
| Database connection refused | Wait for PostgreSQL to be ready: `docker-compose logs postgres`   |
| CORS errors in browser      | Verify `CORS_ORIGINS` matches your frontend URL                   |
| WebSocket connection fails  | Check backend logs for WebSocket hub startup                      |
| Video call connection fails | Configure TURN server in `.env` for NAT traversal                 |
| Node modules issues         | Delete `node_modules` and `package-lock.json`, then `npm install` |
| Vite crypto.hash error      | Upgrade Node.js to 20.19+ or 22.12+ (Node 21 not supported)       |

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

| Variable          | Description                  | Example                                                        |
| ----------------- | ---------------------------- | -------------------------------------------------------------- |
| `DATABASE_DSN`    | PostgreSQL connection string | `postgres://user:pass@host:5432/db?sslmode=require`           |
| `REDIS_URL`       | Redis connection URL         | `redis://user:pass@host:6379`                                  |
| `JWT_SECRET`      | Secret key for JWT signing   | `your-secret-key`                                              |
| `PORT`            | Server port                  | `8080`                                                         |
| `TURN_SERVER_URL` | TURN server URL (optional)   | `turn:turnserver.example.com:3478`                             |
| `TURN_USERNAME`   | TURN username (optional)     | `your-turn-username`                                           |
| `TURN_PASSWORD`   | TURN password (optional)     | `your-turn-password`                                           |
| `CORS_ORIGINS`    | Allowed origins              | `https://yourdomain.com,https://www.yourdomain.com`            |

### Frontend

| Variable       | Description     | Example                   |
| -------------- | --------------- | ------------------------- |
| `VITE_API_URL` | Backend API URL | `https://api.example.com` |
| `VITE_WS_URL`  | WebSocket URL   | `wss://api.example.com`   |

## API Documentation

See [backend/docs](backend/docs) for detailed API documentation including:

- Project structure overview
- Go and Gin framework basics
- GORM database operations
- Redis caching patterns
- Complete API endpoint reference

## License

MIT
