## Requirements

- Node.js >= 18
- MongoDB (local or Atlas)
- Polar developer account (for OAuth client credentials)

## Installation and setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd TrackBP
```

### 2. Backend

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/trackbp
JWT_SECRET=your-secret-key
JWT_LIFESPAN=7d

# Polar OAuth
POLAR_CLIENT_ID=your-polar-client-id
POLAR_CLIENT_SECRET=your-polar-client-secret
POLAR_REDIRECT_URI=http://localhost:3000/api/polar/callback

# Frontend
FRONTEND_DASHBOARD_URL=http://localhost:5173/dashboard
CORS_ORIGIN=http://localhost:5173
```

Run:

```bash
npm run dev          # Development (nodemon)
npm start            # Production
```

### 3. Frontend

```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:3000/api
```

Run:

```bash
npm run dev          # Development (Vite, port 5173)
npm run build        # Production build
```

## API endpoints

### Authentication

| Method | Endpoint             | Description              |
|--------|----------------------|--------------------------|
| POST   | `/api/auth/register` | User registration        |
| POST   | `/api/auth/login`    | Login, returns JWT       |
| GET    | `/api/auth/me`       | Current user profile     |

### Polar integration

| Method | Endpoint                  | Description                  |
|--------|---------------------------|------------------------------|
| GET    | `/api/polar/connect`      | URL for Polar OAuth          |
| GET    | `/api/polar/callback`     | OAuth callback               |
| GET    | `/api/polar/status`       | Connection status            |
| GET    | `/api/polar/exercises`    | Exercises directly from Polar API |
| GET    | `/api/polar/exercise/:id` | Exercise detail from Polar API |

### Activities

| Method | Endpoint                | Description                          |
|--------|-------------------------|--------------------------------------|
| GET    | `/api/activities`       | List of activities (with filtering)  |
| POST   | `/api/activities/sync`  | Synchronization from Polar           |
| GET    | `/api/activities/stats` | Aggregated statistics                |
| GET    | `/api/activities/:id`   | Activity detail (samples, zones, route) |
| PUT    | `/api/activities/:id`   | Update title, description, rating    |
| DELETE | `/api/activities/:id`   | Delete activity (soft delete)        |

Complete API documentation is available at `/api-docs` (Swagger UI) after starting the server.

## Data models

### User

- Email (unique)
- Password (bcrypt hash)
- External service connections (Polar access token, expiration, provider user ID)

### Activity

- Reference to user
- Metadata: sport, date, duration (seconds)
- Statistics: calories, distance, average/maximum heart rate
- Training load: value and interpretation
- Subjective rating: scale 1-5
- Lazy-loaded data (loaded only on detail view):
  - Samples (heart rate, speed, cadence over time)
  - Heart rate zones (range, duration in each zone)
  - GPS route (GeoJSON LineString)

## User features

| ID   | Feature                             | Status |
|------|-------------------------------------|--------|
| US01 | Polar account connection            | Done   |
| US02 | Activity synchronization from Polar | Done   |
| US03 | Activity list view                  | Done   |
| US04 | Activity detail view                | Done   |
| US05 | Heart rate chart over time          | Done   |
| US06 | Speed/pace chart over time          | Done   |
| US07 | Heart rate zones pie chart          | Done   |
| US08 | Route map (Leaflet)                 | Done   |
| US09 | Edit activity title and description | Done   |
| US10 | Subjective feeling rating           | Done   |
| US11 | Delete activity                     | Done   |

## Non-functional requirements

| ID   | Requirement                                  | Status |
|------|----------------------------------------------|--------|
| NF01 | Passwords hashed with bcrypt                 | Done   |
| NF02 | API protected with JWT                       | Done   |
| NF03 | Third-party tokens stored only on backend    | Done   |
| NF04 | Activity list loads within 2 seconds         | Done   |
| NF05 | Lazy loading of samples (detail view)        | Done   |
| NF06 | Extensibility for additional providers       | Done   |
| NF07 | Responsive design                            | Done   |

## Testing

The backend includes unit and integration tests:

```bash
cd server
npm test
```

- **Unit tests:** Models, services, middleware, utilities
- **Integration tests:** API endpoints via Supertest
- **Database:** MongoDB Memory Server (in-memory DB for tests)

## Deployment

- **Backend:** Render (Web Service) — [trackbp.onrender.com](https://trackbp.onrender.com)
- **Frontend:** Vercel — [track-bp.vercel.app](https://track-bp.vercel.app)
- **Database:** MongoDB Atlas

### Production environment variables (backend)

```env
MONGODB_URI=<MongoDB Atlas connection string>
JWT_SECRET=<secret key>
JWT_LIFESPAN=7d
POLAR_CLIENT_ID=<Polar client ID>
POLAR_CLIENT_SECRET=<Polar client secret>
POLAR_REDIRECT_URI=https://trackbp.onrender.com/api/polar/callback
FRONTEND_DASHBOARD_URL=https://track-bp.vercel.app/dashboard
CORS_ORIGIN=https://track-bp.vercel.app
```

## Author

Bachelor thesis — Jakub Baloun
