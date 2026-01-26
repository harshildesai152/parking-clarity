const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 1. Get token from cookies OR request body (as requested by user)
  const token = req.cookies.auth_token || req.body.token;

  // 2. Check if token exists
  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required', 
      message: 'Please login first to perform this action.' 
    });
  }

  try {
    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // 4. Attach user data to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(401).json({ 
      error: 'Invalid token', 
      message: 'Your session has expired or is invalid. Please login again.' 
    });
  }
};

module.exports = authMiddleware;
