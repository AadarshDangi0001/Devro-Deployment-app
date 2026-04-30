import express from 'express';
import passport from '../config/passport.js';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Google
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login`, session: true }),
  authController.googleCallback
);

// GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/login`, session: true }),
  authController.githubCallback
);

router.get('/me', authController.getCurrentUser);

router.post('/logout', requireAuth, authController.logout);

export default router;
