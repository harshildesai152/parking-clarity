const dbConnect = require('../db');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    await dbConnect();
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ error: 'OTP expired or not found' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    // In Vercel functions, we set cookies via header
    res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

    return res.status(200).json({ 
      success: true, 
      message: 'OTP verified successfully',
      token 
    });
  } catch (error) {
    console.error('SERVER ERROR IN VERIFY-OTP:', error);
    return res.status(500).json({ error: 'Failed to verify OTP', details: error.message });
  }
}
