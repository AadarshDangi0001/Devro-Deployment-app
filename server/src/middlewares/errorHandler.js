export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.message === 'Unauthorized') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (err.message === 'Forbidden') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (err.status === 429) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};
