// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authorizeChannel = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.id;

    // TODO: Replace with MongoDB logic to check user-channel access
    // Example: Use a UserChannel or Channel model to check access
    // For now, allow all for development
    req.userRole = 'owner';
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
};

module.exports = { authenticateToken, authorizeChannel };