const nodemailer = require('nodemailer');
const crypto = require('crypto');

const otpService = {
  generateOTP: () => {
    return crypto.randomInt(100000, 999999).toString();
  },

  sendOTPEmail: async (email, otp) => {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Parking Clarity" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code - Parking Clarity',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Parking Clarity Verification</h2>
          <p style="font-size: 16px; color: #555;">Hello,</p>
          <p style="font-size: 16px; color: #555;">You requested an OTP for verification. Please use the following code:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #888;">This code can be used one time only and is valid for 5 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #aaa; text-align: center;">&copy; 2026 Parking Clarity. All rights reserved.</p>
        </div>
      `,
    };

    return transporter.sendMail(mailOptions);
  },
};

module.exports = otpService;
