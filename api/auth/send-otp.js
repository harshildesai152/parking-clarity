import dbConnect from '../db.js';
import OTP from '../models/OTP.js';
import otpService from '../utils/otpService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    await dbConnect();
    const otp = otpService.generateOTP();

    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    await otpService.sendOTPEmail(email, otp);
    return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('SERVER ERROR IN SEND-OTP:', error);
    return res.status(500).json({ 
      error: 'Failed to send OTP', 
      details: error.message 
    });
  }
}
