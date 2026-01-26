const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // Import JWT
const OTP = require('../models/OTP');
const otpService = require('../utils/otpService');

// @route   POST /api/auth/send-otp
// @desc    Generate and send OTP to email
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  console.log("The email is : ++++++=============================", email)

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // 1. Generate OTP
    const otp = otpService.generateOTP();

    // 2. Save to DB (Update existing or create new)
    // We use findOneAndUpdate to ensure only one OTP active per email
    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // 3. Send via Nodemailer
    console.log("Attempting to send email to:", email);
    await otpService.sendOTPEmail(email, otp);
    console.log("Email sent successfully");

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('SERVER ERROR IN SEND-OTP:', error);
    res.status(500).json({ 
      error: 'Failed to send OTP', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify the OTP provided by user
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    // 1. Find the OTP record
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ error: 'OTP expired or not found' });
    }

    // 2. Check if OTP matches
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // 3. Success - Delete the OTP record so it can't be reused
    await OTP.deleteOne({ _id: otpRecord._id });

    // 4. Generate JWT Token
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    // 5. Set Cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(200).json({ 
      success: true, 
      message: 'OTP verified successfully',
      token // Return the token to frontend
    });
  } catch (error) {
    console.error('SERVER ERROR IN VERIFY-OTP:', error);
    res.status(500).json({ error: 'Failed to verify OTP', details: error.message });
  }
});

module.exports = router;
