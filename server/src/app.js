import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import './config/passport.js';
import authRouter from './routes/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
app.use(express.json());
app.use(cookieParser());

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many failed login attempts, please try again later.',
});

app.use(limiter);

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(
  session({
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'change_this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authLimiter, authRouter);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(errorHandler);

export default app;