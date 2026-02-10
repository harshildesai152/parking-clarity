const dbConnect = require('./db.js');

module.exports = async function handler(req, res) {
  try {
    console.log('Test API called');
    console.log('Environment check:', {
      MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV
    });

    await dbConnect();
    console.log('Database connected successfully');

    return res.status(200).json({ 
      success: true, 
      message: 'API is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test API Error:', error);
    return res.status(500).json({ 
      error: 'Test failed', 
      details: error.message 
    });
  }
}
