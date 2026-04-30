export const googleCallback = (req, res) => {
  res.json({ ok: true, user: req.user });
};

export const githubCallback = (req, res) => {
  res.json({ ok: true, user: req.user });
};

export const getCurrentUser = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ authenticated: true, user: req.user });
};

export const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((destroyErr) => {
      res.clearCookie('sid');
      if (destroyErr) {
        return res.status(500).json({ error: 'Session destroy failed' });
      }
      res.json({ ok: true });
    });
  });
};
