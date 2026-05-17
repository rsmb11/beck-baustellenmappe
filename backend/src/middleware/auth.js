const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'Kein Token' });

  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Kein Token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token ungültig' });
  }
};
