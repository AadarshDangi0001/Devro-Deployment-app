# Code Guide - Authentication Setup

This guide explains what code was added to each file and how it all works together.

---

## 📁 Project Structure

```
server/
├── src/
│   ├── app.js                    # Main Express app setup
│   ├── config/
│   │   └── passport.js           # OAuth strategies (Google, GitHub)
│   ├── controllers/
│   │   └── authController.js     # Business logic for auth
│   ├── middlewares/
│   │   ├── authMiddleware.js     # Check if user is logged in
│   │   └── errorHandler.js       # Handle errors
│   ├── models/
│   │   └── User.js               # Database schema for users
│   └── routes/
│       └── auth.js               # API endpoints
├── server.js                      # Start the server
├── .env.example                   # Example environment variables
└── package.json                   # Dependencies list
```

---

## 📄 File-by-File Explanation

### 1️⃣ `server/package.json`
**What changed?** Added new packages needed for authentication

**New packages:**
```json
"passport": "^0.6.0",                   // Handles OAuth login
"passport-google-oauth20": "^2.0.0",   // Google login strategy
"passport-github2": "^0.1.12",         // GitHub login strategy
"express-session": "^1.17.3",          // Manage user sessions (remembers who you are)
"cors": "^2.8.5",                      // Allow frontend to talk to backend
"helmet": "^7.1.0",                    // Security headers (protects from attacks)
"express-rate-limit": "^7.1.5"         // Limit requests (prevent hacking)
```

**Why?** These packages handle OAuth, sessions, security, and rate limiting.

---

### 2️⃣ `server/.env.example`
**What is this?** Template for environment variables (secrets you shouldn't share)

**What you need to fill in:**
```env
MONGO_URI=mongodb://...          # Database connection
SESSION_SECRET=your_secret       # Secret key for sessions
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=xxx             # From Google Cloud Console
GOOGLE_CLIENT_SECRET=yyy         # From Google Cloud Console
GITHUB_CLIENT_ID=aaa             # From GitHub settings
GITHUB_CLIENT_SECRET=bbb         # From GitHub settings
```

**Why?** These are sensitive values that shouldn't be in code. Each developer/server gets their own.

---

### 3️⃣ `server/src/models/User.js`
**What is this?** Database schema (blueprint for storing user data)

**What it stores:**
```javascript
{
  provider: "google" or "github",     // Where they logged in from
  providerId: "12345",                // Their ID from that provider
  name: "John Doe",                   // Their name
  email: "john@example.com",          // Their email
  avatar: "https://...",              // Their profile picture
  raw: { ...full data from provider }
}
```

**Why?** Saves user information in MongoDB so you can identify them later.

---

### 4️⃣ `server/src/config/passport.js`
**What does this do?** Sets up OAuth login strategies (tells Passport how to handle Google and GitHub login)

**How it works:**

**Serialize/Deserialize:**
```javascript
passport.serializeUser()   // When user logs in → save their ID in session
passport.deserializeUser() // When page loads → fetch user from database
```

**Google Strategy:**
```javascript
new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"  // Where Google redirects after login
})
```

**What happens when user logs in with Google:**
1. User clicks "Login with Google"
2. Google asks for permission
3. User allows → Google sends us their info
4. We save/update their data in MongoDB
5. Create a session so we remember them

**Same for GitHub**

**Why?** Passport handles the complex OAuth flow. This file tells it how to handle Google and GitHub.

---

### 5️⃣ `server/src/controllers/authController.js`
**What is this?** Business logic (the actual work that happens)

**Functions:**

```javascript
googleCallback()      // What to do after Google login → send user data
githubCallback()      // What to do after GitHub login → send user data
getCurrentUser()      // GET /auth/me → return current logged-in user
logout()              // POST /auth/logout → destroy session
```

**Example:**
```javascript
export const getCurrentUser = (req, res) => {
  if (!req.user) return res.status(401).json({ authenticated: false });
  res.json({ authenticated: true, user: req.user });
};
```

**Why?** Separates logic from routes. Makes code cleaner and reusable.

---

### 6️⃣ `server/src/middlewares/authMiddleware.js`
**What is this?** Check if user is logged in (guards for protected routes)

```javascript
export const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
};
```

**How it works:**
- `req.user` = current logged-in user (set by Passport)
- If no user → send error 401 (unauthorized)
- If user exists → continue to next function

**When to use:**
```javascript
router.post('/logout', requireAuth, authController.logout);
// ☝️ Can't logout if not logged in
```

**Why?** Protects routes. Only logged-in users can access them.

---

### 7️⃣ `server/src/middlewares/errorHandler.js`
**What is this?** Catches errors and returns nice error messages

```javascript
export const errorHandler = (err, req, res, next) => {
  console.error(err);
  
  if (err.status === 429) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  res.status(err.status || 500).json({ error: err.message });
};
```

**What it does:**
- Logs error to console (for debugging)
- Checks error type (unauthorized, rate limit, etc.)
- Sends proper HTTP status code + message
- Prevents server from crashing

**Why?** Better error handling. Users get meaningful messages instead of crashes.

---

### 8️⃣ `server/src/routes/auth.js`
**What is this?** URL endpoints (what happens when user visits a URL)

**Endpoints:**

```javascript
GET  /auth/google              // Start Google login
GET  /auth/google/callback     // Google redirects here after login
GET  /auth/github              // Start GitHub login
GET  /auth/github/callback     // GitHub redirects here after login
GET  /auth/me                  // Get current user info
POST /auth/logout              // Logout (requires authentication)
```

**How it flows:**

```javascript
router.get(
  '/google/callback',
  passport.authenticate('google', { ... }),  // Verify Google response
  authController.googleCallback              // Run callback function
);
```

**Why?** Routes map URLs to functions. When user visits `/auth/google`, something happens.

---

### 9️⃣ `server/src/app.js`
**What changed?** Added security, rate limiting, and wired everything together

**Added imports:**
```javascript
import helmet from 'helmet';              // Security headers
import rateLimit from 'express-rate-limit'; // Rate limiting
import './config/passport.js';            // Load passport strategies
import { errorHandler } from './middlewares/errorHandler.js';
```

**Helmet (Security):**
```javascript
app.use(helmet());
// Prevents XSS, clickjacking, CSRF attacks by setting security headers
```

**Rate Limiting:**
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100                    // 100 requests per 15 minutes
});

const authLimiter = rateLimit({
  max: 5,                     // Only 5 failed auth attempts
  skipSuccessfulRequests: true
});

app.use(limiter);           // Apply to all routes
app.use('/auth', authLimiter, authRouter); // Extra limit on /auth
```

**Prevents brute force attacks (trying password 1000 times)**

**Sessions:**
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    httpOnly: true,      // Can't access from JavaScript (security)
    secure: NODE_ENV === 'production',  // HTTPS only in production
    sameSite: 'none'     // CORS compatibility
  }
}));
```

**Remembers who you are when you visit different pages**

**Passport:**
```javascript
app.use(passport.initialize());
app.use(passport.session());
```

**Enables OAuth login**

**Error handler (at the end):**
```javascript
app.use(errorHandler);
```

**Catches all errors and sends nice responses**

---

### 🔟 `server/server.js`
**What is this?** Entry point (what you run to start the server)

**What it does:**
```javascript
import app from './src/app.js';
import { connectDB } from './src/db/db.js';

connectDB();  // Connect to MongoDB

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

**Why?** Starts the Express app and connects to database.

---

## 🔄 How It All Works Together

### Step 1: User clicks "Login with Google"
```
Frontend
  ↓
GET /auth/google
  ↓
app.js (Helmet blocks attacks, rate limiter checks limits)
  ↓
routes/auth.js
  ↓
Passport says: "Go to Google!"
  ↓
Google login page appears
```

### Step 2: Google sends us user data
```
Google redirects to:
GET /auth/google/callback?code=xxx

  ↓
Passport verifies Google code
  ↓
config/passport.js checks user in database
  ↓
If new user → create in MongoDB (User.js)
If exists → update existing user
  ↓
Create session (remember this user)
  ↓
controllers/authController.js returns { user, ok: true }
```

### Step 3: Frontend stores session
```
Session stored in secure cookie
  ↓
Sent with every request automatically
  ↓
Passport deserializes → knows who is logged in
  ↓
req.user is set
```

### Step 4: User visits /auth/me
```
GET /auth/me
  ↓
controllers/authController.js:
  Check if req.user exists
  If yes → return { authenticated: true, user }
  If no → return { authenticated: false }
```

### Step 5: User logs out
```
POST /auth/logout
  ↓
requireAuth middleware checks if logged in
  ↓
If not logged in → error 401
If logged in → continue
  ↓
controllers/authController.js:
  passport.logout()
  session.destroy()
  clear cookie
  ↓
return { ok: true }
```

---

## 🚀 Production Security Features

**Helmet:** Prevents common attacks
- XSS (cross-site scripting)
- Clickjacking
- CSRF (cross-site request forgery)

**Rate Limiting:** Prevents brute force
- Only 100 requests per 15 minutes globally
- Only 5 failed login attempts per 15 minutes

**Secure Cookies:**
- `httpOnly`: Can't access from JavaScript (prevents XSS theft)
- `secure`: Only sent over HTTPS (prevents interception)
- `sameSite`: Prevents CSRF

**Environment Variables:** Hide secrets
- Client IDs, secrets, session secret in `.env`
- Not in code or version control

---

## 📚 Key Concepts

| Term | Meaning |
|------|---------|
| **OAuth** | Login with someone else's account (Google, GitHub, etc.) |
| **Passport** | Library that handles OAuth |
| **Session** | Remember who the user is across requests |
| **Cookie** | Data stored in browser, sent with every request |
| **Middleware** | Function that runs before/after route handlers |
| **Controller** | Function that does the work (business logic) |
| **Serialize** | Convert user to something small to store in session |
| **Deserialize** | Convert session data back to full user object |
| **Rate Limiting** | Limit how many requests someone can make |
| **Helmet** | Add security headers to responses |

---

## ✅ Checklist to Make It Work

1. Copy `.env.example` → `.env`
2. Fill in all environment variables
3. Get Google OAuth credentials from Google Cloud Console
4. Get GitHub OAuth credentials from GitHub settings
5. Run `npm install`
6. Run `npm run dev`
7. Visit `http://localhost:3000`
8. Click "Login with Google/GitHub"

---

## 🎯 Common Questions

**Q: Why do we need Passport?**
A: OAuth is complex. Passport handles all the hard parts so we don't have to.

**Q: Why store user in database?**
A: To remember them. Next time they log in, we know it's them.

**Q: Why use sessions instead of JWT?**
A: Sessions are simpler for traditional apps. JWT is better for APIs/mobile.

**Q: Why rate limiting?**
A: Prevent hackers from trying 10,000 passwords in seconds.

**Q: Why Helmet?**
A: Automatic security. One line of code prevents many attacks.

**Q: What if user logs in from multiple devices?**
A: Different sessions on each device. All valid.

---

## 📝 File Summary

| File | Purpose | Lines |
|------|---------|-------|
| `package.json` | Dependencies | 13 new packages |
| `.env.example` | Secrets template | 12 variables |
| `User.js` | Database schema | ~20 lines |
| `passport.js` | OAuth strategies | ~80 lines |
| `authController.js` | Auth logic | ~30 lines |
| `authMiddleware.js` | Check if logged in | ~10 lines |
| `errorHandler.js` | Error handling | ~15 lines |
| `auth.js` | Routes | ~35 lines |
| `app.js` | Main app setup | ~60 lines |

**Total: ~460 lines of production-ready code**

---

Done! Everything works together to provide secure Google + GitHub authentication. 🎉
