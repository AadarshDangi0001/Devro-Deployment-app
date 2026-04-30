# Authentication Setup (Google + GitHub) - Production Ready

## Features

- **OAuth 2.0** (Google + GitHub) with Passport.js
- **Helmet** for security headers (XSS, CSRF, clickjacking protection)
- **Rate Limiting** (global 100 req/15min, auth endpoints 5 failed attempts/15min)
- **Session Management** with secure cookies
- **Controllers & Middlewares** for clean architecture
- **Error Handling** middleware
- **CORS** with credentials support

## 1) Install Dependencies

```bash
npm install
```

## 2) Environment Variables

Copy `.env.example` to `.env` and set these values:

- `MONGO_URI` - MongoDB connection string
- `SESSION_SECRET` - a long random secret (min 32 chars)
- `FRONTEND_URL` - URL of frontend to allow CORS and redirects
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`
- `NODE_ENV` - set to `production` for production deployments

## 3) OAuth App Setup

### Google
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 Credentials (Web application)
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### GitHub
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/auth/github/callback`
4. Copy Client ID and Client Secret to `.env`

## 4) Production Checklist

### Security
- ✅ **Helmet** enabled (security headers)
- ✅ **Rate limiting** enabled (prevent brute force)
- ✅ **CORS** restricted to frontend URL
- ✅ **Secure cookies** (httpOnly, sameSite, secure in production)
- ✅ **Session secret** required (set strong value)

### Deployment
- Serve backend over **HTTPS** (secure cookies require HTTPS)
- Set `NODE_ENV=production`
- Set `SESSION_SECRET` to a strong random value
- Configure `FRONTEND_URL` to deployed frontend URL
- If behind proxy/load balancer: ensure `app.set('trust proxy', 1)` is enabled
- Use persistent session store (Redis) for horizontal scaling

### Scaling
For production with multiple instances, add Redis session store:

```bash
npm install connect-redis redis
```

Update `src/app.js` to use Redis:

```javascript
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect();

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    // ... rest of config
  })
);
```

## 5) API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| GET | `/auth/google` | Start Google OAuth | No |
| GET | `/auth/google/callback` | Google callback | No |
| GET | `/auth/github` | Start GitHub OAuth | No |
| GET | `/auth/github/callback` | GitHub callback | No |
| GET | `/auth/me` | Get current user | No |
| POST | `/auth/logout` | Logout (clears session) | Yes |

## 6) Project Structure

```
src/
├── app.js                 # Express app with helmet, rate limiting
├── config/
│   └── passport.js       # Passport strategies (Google, GitHub)
├── controllers/
│   └── authController.js # Auth logic (callback handlers)
├── middlewares/
│   ├── authMiddleware.js # Authentication middleware
│   └── errorHandler.js   # Error handling middleware
├── models/
│   └── User.js           # User schema (OAuth provider + data)
└── routes/
    └── auth.js           # Auth routes
```

## 7) Development

```bash
npm run dev
```

Server runs at `http://localhost:3000`

## 8) Rate Limiting

- **Global**: 100 requests per 15 minutes
- **Auth endpoints** (`/auth/google`, `/auth/github`, `/auth/logout`): 5 failed attempts per 15 minutes

Customize in `src/app.js`:

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // limit each IP to 100 requests per windowMs
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,  // don't count successful requests
});
```

## 9) Security Headers (Helmet)

Helmet automatically sets these headers:
- `Content-Security-Policy`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection`
- `Referrer-Policy`

Customize in `src/app.js`:

```javascript
app.use(helmet({
  contentSecurityPolicy: false,  // if needed for your setup
}));
```


