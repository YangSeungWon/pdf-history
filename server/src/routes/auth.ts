import { Router, Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    authenticated: boolean;
  }
}

const router = Router();

const APP_PASSWORD = process.env.APP_PASSWORD || 'changeme';

router.post('/login', (req: Request, res: Response) => {
  const { password } = req.body;

  if (password === APP_PASSWORD) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

router.get('/check', (req: Request, res: Response) => {
  res.json({ authenticated: req.session.authenticated === true });
});

router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Logout failed' });
    } else {
      res.json({ success: true });
    }
  });
});

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session.authenticated === true) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export default router;
